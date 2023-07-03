var AWS = require('aws-sdk');
let { db } = require('./postresHandler')
const { v4: uuidv4 } = require('uuid');

const cognito = new AWS.CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
});

async function checkAdminUserExists(username, userPoolId) {
    try {
        const params = {
            Username: username,
            UserPoolId: userPoolId,
        };

        await cognito.adminGetUser(params).promise();
        console.log("Check AdminId Validness",params)
        return true; // User exists
    } catch (error) {
        console.log("MEOW ERROR",error)

        if (error.code === 'UserNotFoundException') {
            return false; // User does not exist
        }
        throw error; // Other error occurred
    }
}

const saveDataToPostGresDB = async(body,uid) => {
    console.log('save Data to PostgresDB called')
    const currentTimestamp =  new Date().toUTCString();


    return await db.tx(t => {
        let queries = []
        queries.push(t.one('INSERT INTO BOOTH(booth_id, name, email, phone_number, active, address, city, state, country, zip, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING booth_id', [
            uid,
            body.name,
            body.email,
            body.phone,
            body.active,
            body.address,
            body.city,
            body.state,
            body.country,
            body.zip,
            currentTimestamp,
            currentTimestamp,
        ]))
        return t.batch(queries);

    }).catch(error => {
        console.log('ERROR:', error);
        return { error: error };
    });
}
let updateDataToPostGresDB = async(body,uid) => {
    console.log('update Data to PostgresDB called')
    const currentTimestamp =  new Date().toUTCString();


    return await db.tx(t => {
        let queries = []
        queries.push(t.one('UPDATE BOOTH SET name = $2, email = $3, phone_number = $4, active = $5, address = $6, city = $7, state = $8, country = $9, zip = $10, updated_at = $11 WHERE booth_id = $1 RETURNING booth_id', [
            uid,
            body.name,
            body.email,
            body.phone,
            body.active,
            body.address,
            body.city,
            body.state,
            body.country,
            body.zip,
            currentTimestamp
        ]))
        return t.batch(queries);

    }).catch(error => {
        console.log('ERROR:', error);
        return { error: error };
    });
}
exports.handler = async(event) => {
    console.log(event);
    const body = JSON.parse(event.body);
    let randomUUID = null;

    // Check whether the user is admin or not
    try {
        const userExists = await checkAdminUserExists(body.adminId, process.env.ADMINPOOLID);
        if (userExists) {
            if (db instanceof Promise) {
                db = await db;
            }
            console.log(db)
            let res = null;

            if(!body.type){
                res = {
                    statusCode: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ "message": "Either Json structure invalid or attr type is missing" })
                };
            }

            try {
                // Create user to the cognito
                if(body.type === 'create'){
                    const cognitoParams = {
                        UserPoolId: process.env.BOOTHPOOLID,
                        Username: body.email,
                        DesiredDeliveryMediums : ["EMAIL"],
                        UserAttributes: [{
                            Name: "email",
                            Value: body.email,
                        },
                            {
                                Name: "phone_number",
                                Value: body.phone
                            }
                        ],
                        TemporaryPassword: body.temporary_password,
                    };
                    try {
                        let response = await cognito.adminCreateUser(cognitoParams).promise();
                        randomUUID = response.User.Attributes.find((attr) => attr.Name === 'sub').Value;
                        console.log(response)
                    } catch (e) {
                        console.log(`Error While Creating the user`)
                        console.error(e)
                        return {
                            statusCode: 500,
                            body: JSON.stringify(e),
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }
                    }
                } else if(body.type === 'update'){
                    const cognitoParams = {
                        UserPoolId: process.env.BOOTHPOOLID,
                        Username: body.email,
                        UserAttributes: [{
                            Name: "phone_number",
                            Value: body.phone
                        },
                            {
                                Name: "email",
                                Value: body.email
                            }
                        ]
                    };
                    try {
                        let response = await cognito.adminUpdateUserAttributes(cognitoParams).promise();
                        let userStatusResponse = null
                        if (!body.active) {
                            userStatusResponse = await cognito.adminDisableUser({
                                "Username": body.email,
                                "UserPoolId": process.env.BOOTHPOOLID
                            }).promise();
                        } else {
                            userStatusResponse = await cognito.adminEnableUser({
                                "Username": body.email,
                                "UserPoolId": process.env.BOOTHPOOLID
                            }).promise();
                        }
                        console.log('User status response ' + userStatusResponse)
                        console.log('Cognito Response',response)
                    } catch (e) {
                        console.log(`Error While Updating the user`)
                        console.error(e)
                        return {
                            statusCode: 500,
                            headers: {
                                'Content-Type': 'application/json',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }
                    }

                }

                let results = []
                //Insert to Postgres
                results =
                    body.type ==="create"?
                    await saveDataToPostGresDB(body,randomUUID):
                        await updateDataToPostGresDB(body,body.boothId)
                if (results.error) {
                    throw results.error
                }
                console.log(results)
                res = {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ message: body.type ==="create"?"Booth Creation Successful":"Booth Updation Successful" })
                };
                return res;
            } catch (e) {
                console.log(e);
                res = {
                    statusCode: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({ "message": e })
                };
                return res;
            }


        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Given Admin Id doesnt Exists or do not have required access' }),
            };
        }
    } catch (error) {
        console.log("MEOW ERROR",error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error occurred while checking user' }),
        };
    }
};