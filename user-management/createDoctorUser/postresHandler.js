const AWS = require('aws-sdk'),
    region = process.env.CDK_DEFAULT_REGION;
let secret = undefined;

const pgp = require('pg-promise')({
    connect(client) {
        const cp = client.connectionParameters;
        console.log('Connected to database=>:', cp.database);
    },
    disconnect(client) {
        const cp = client.connectionParameters;
        console.log('Disconnecting from database:', cp.database);
    },
    error(err, e) {

        if (e.cn) {
            // this is a connection-related error
            // cn = safe connection details passed into the library:
            //      if password is present, it is masked by #
            console.error("Unable To connenct ", e.cn)
        }

        if (e.query) {
            // query string is available
            console.error("Query fail for", e.query)
            if (e.params) {
                // query parameters are available
                console.error("invalid parameter ", e.params)
            }
        }

        if (e.ctx) {
            console.error("transaction falied")
                // occurred inside a task or transaction
        }
        throw err
    }
});

exports.db = new Promise((res) => {
    const secret = {
        connectionString: 'postgres://postgres:Snumbers2023@postgres.csa11jyrz2mk.ap-south-1.rds.amazonaws.com:5432/snum_oms_dev?sslmode=disable'
    };
    res(pgp(secret))
});