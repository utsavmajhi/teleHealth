var AWS = require('aws-sdk');
let { db } = require('./postresHandler')
const { v4: uuidv4 } = require('uuid');

const cognito = new AWS.CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
});

let saveDataToPostGresDB = async(body,uid) => {
    console.log('save Data to PostgresDB called')
    const currentTimestamp =  new Date().toUTCString();

    return await db.tx(t => {
        let queries = []
        queries.push(t.one('INSERT INTO ADMIN(user_id, first_name, last_name, email, phone_number, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING user_id', [
            uid,
            body.firstName,
            body.lastName,
            body.email,
            body.phone,
            currentTimestamp,
            currentTimestamp,
        ]))
        return t.batch(queries);

    }).catch(error => {
        console.log('ERROR:', error);
        return { error: error };
    });
}

let updateDataInPostGresDB = async(body,uid) => {
    console.log('update Data to PostgresDB called')
    const currentTimestamp =  new Date().toUTCString();

    return await db.tx(t => {
        let queries = []
        queries.push(t.none('UPDATE ADMIN SET first_name = $1, last_name = $2, email = $3, phone_number = $4, updated_at = $5 WHERE user_id = $6', [
            body.firstName,
            body.lastName,
            body.email,
            body.phone,
            currentTimestamp,
            uid
        ]));
        return t.batch(queries);

    }).catch(error => {
        console.log('ERROR:', error);
        return { error: error };
    });
}

exports.handler = async(event) => {
    console.log(event);

    if (db instanceof Promise) {
        db = await db;
    }
    console.log(db)
    const body = JSON.parse(event.body);
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
    let randomUUID = null;
    try {
        // Create user to the cognito
        if(body.type === 'create'){
            const cognitoParams = {
                UserPoolId: process.env.ADMINPOOLID,
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
                UserPoolId: process.env.ADMINPOOLID,
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
                        "UserPoolId": process.env.ADMINPOOLID
                    }).promise();
                } else {
                    userStatusResponse = await cognito.adminEnableUser({
                        "Username": body.email,
                        "UserPoolId": process.env.ADMINPOOLID
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
        results = body.type ==="create"?
            await saveDataToPostGresDB(body, randomUUID):
        await updateDataInPostGresDB(body,body.supervisorId);
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
            body: JSON.stringify({ message: body.type ==="create"?"Admin User Creation Successful":"Admin User Updation Successful" })
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
};