let { db } = require('./postresHandler')
const { v4: uuidv4 } = require('uuid');

let assignDataToPostGresDB = async(body) => {
    console.log('save Data to PostgresDB called')
    const currentTimestamp =  new Date().toUTCString();

    return await db.tx(t => {
        let queries = []
            queries.push(t.one('INSERT INTO BOOTH_DOCTORS (booth_id, doctor_id, created_at, updated_at) SELECT $1, $2, $4, $5 WHERE EXISTS ( SELECT 1 FROM ADMIN WHERE user_id = $3 ) ON CONFLICT (booth_id, doctor_id) DO NOTHING RETURNING booth_id', [
            body.boothId,
            body.doctorId,
            body.adminId,
            currentTimestamp,
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

    if (db instanceof Promise) {
        db = await db;
    }
    console.log(db)
    const body = JSON.parse(event.body);
    let res = null;
    if(!body.doctorId || !body.adminId ||!body.boothId){
        res = {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ "message": "Either Json structure invalid or doctorId/adminId is missing" })
        };
        return res;
    }
    try {
        let results = []
        //Insert to Postgres
        results = await assignDataToPostGresDB(body)
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
            body: JSON.stringify({ message: `Doctor Id: ${body.doctorId} assigned to Booth Id: ${body.boothId} reviewed` })
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