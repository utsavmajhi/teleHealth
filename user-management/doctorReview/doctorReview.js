var AWS = require('aws-sdk');
let { db } = require('./postresHandler')
const { v4: uuidv4 } = require('uuid');

const cognito = new AWS.CognitoIdentityServiceProvider({
    apiVersion: "2016-04-18",
});

let saveReviewStatusToPostGresDB = async(body) => {
    console.log('save Data to PostgresDB called')
    const currentTimestamp =  new Date().toUTCString();

    return await db.tx(t => {
        let queries = []
            queries.push(t.one('UPDATE DOCTOR SET active = $1, updated_at = $4 WHERE doctor_id = $2 AND doctor_id IN (SELECT doctor_id FROM DOCTOR) AND $3 IN (SELECT user_id FROM ADMIN) RETURNING doctor_id', [
            body.reviewStatus,
            body.doctorId,
            body.adminId,
            currentTimestamp,
        ]))
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
    if(!body.doctorId || !body.adminId){
        res = {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ "message": "Either Json structure invalid or doctorId/supervisorId is missing" })
        };
        return res;
    }
    try {
        let results = []
        //Insert to Postgres
        const boothReviewStatus = body.reviewStatus;
        results = await saveReviewStatusToPostGresDB(body)
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
            body: JSON.stringify({ message: `Doctor Id: ${body.doctorId} reviewed` })
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