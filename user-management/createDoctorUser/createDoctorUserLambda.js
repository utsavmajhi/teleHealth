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
        queries.push(t.one('INSERT INTO DOCTOR(doctor_id,first_name,last_name,gender,speciality,email,phone,address,city,state,country,zip,active,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (doctor_id) DO UPDATE SET first_name = $2,last_name=$3,email=$6,phone=$7,speciality=$5,updated_at=$15 RETURNING doctor_id', [
            uid,
            body.firstName,
            body.lastName,
            body.gender,
            body.speciality,
            body.email,
            body.phone,
            body.address,
            body.city,
            body.state,
            body.country,
            body.zip,
            body.active,
            currentTimestamp,
            currentTimestamp,
        ]))
        return t.batch(queries);

    }).catch(error => {
        console.log('ERROR:', error);
        return { error: error };
    });
    return true;
}

let updateDataInPostGresDB = async(body,uid) => {
    console.log('update Data to PostgresDB called')
    const currentTimestamp =  new Date().toUTCString();

    return await db.tx(t => {
        let queries = []
        queries.push(t.one('UPDATE DOCTOR SET first_name = $2, last_name = $3, gender = $4, speciality = $5, email = $6, phone = $7, address = $8, city = $9, state = $10, country = $11, zip = $12, active = $13, updated_at = $14 WHERE doctor_id = $1 RETURNING doctor_id', [
            uid,
            body.firstName,
            body.lastName,
            body.gender,
            body.speciality,
            body.email,
            body.phone,
            body.address,
            body.city,
            body.state,
            body.country,
            body.zip,
            body.active,
            currentTimestamp,
        ]))
        return t.batch(queries);

    }).catch(error => {
        console.log('ERROR:', error);
        return { error: error };
    });
    return true;
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
                UserPoolId: process.env.DOCTORUSERPOOLID,
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
                UserPoolId: process.env.DOCTORUSERPOOLID,
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
                        "UserPoolId": process.env.DOCTORUSERPOOLID
                    }).promise();
                } else {
                    userStatusResponse = await cognito.adminEnableUser({
                        "Username": body.email,
                        "UserPoolId": process.env.DOCTORUSERPOOLID
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
        await updateDataInPostGresDB(body,body.doctorId);
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
            body: JSON.stringify({ message: body.type ==="create"?"User Creation Successful":"User Updation Successful" })
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