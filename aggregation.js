const client = require('./connection');
/* 
The aggregation pipeline is a framework in MongoDB
that enables the developers to execute a series 
of data transformations on the documents in a collection.
 */


// $match $sort and $project
async function printMatch(client, balanceGreater) {
    const pipeline = [
        {
            $match: {
                balance: { $gt: balanceGreater }
            }
        }, {
            $sort: {
                balance: -1
            }
        }, {
            $project: {
                _id: 0,
                accountId: 1,
                accountHolder: 1,
                account_type: 1,
                balance: 1,
                // balance in Great British Pound
                gbp_balance: {
                    $divide: ['$balance', 1.3]
                }
            }
        },
    ];
    const dbo = client.db('bank').collection('accounts');
    const aggCursor = await dbo.aggregate(pipeline);
    for await (const doc of aggCursor)
        console.log(doc);
}

// $match $sort and $group
async function printAccountMatch(client, balanceGreater) {
    const pipeline = [
        // Stage 1: All account match balance > given amount.
        // $match should be placed early in your pipeline to reduce the number of documents to process.
        {
            $match: {
                balance: { $gt: balanceGreater }
            },
        },
        {
            // Stage 2: Group results with _id: accountId, accountHolder,balance.
            $group: {
                _id: '$accountId',
                name: { $first: '$accountHolder' },
                balance: { $first: '$balance' },
                total_balance: { $sum: '$balance' },
            },
        },
        // Stage 3: Calculate avg balance & total balance
        {
            $group: {
                _id: null,
                accounts: {
                    $push: {
                        name: '$name',
                        balance: '$balance'
                    }
                },
                total_balance: { $sum: '$balance' },
                avg_balance: { $avg: '$balance' },
            },
        },
        // Stage 4: Sort accounts in balance descending order.
        {
            $unwind: '$accounts'
        },
        {
            $sort: {
                'accounts.balance': - 1
            }
        }
    ];

    const dbo = client.db('bank').collection('accounts');
    const aggCursor = await dbo.aggregate(pipeline);


    let totalBalance = null;
    await aggCursor.forEach(result => {
        if (totalBalance === null) {// Some tricks
            console.log('Total Balance:', result.total_balance);
            console.log('Average Balance:', result.avg_balance);
            console.log('Individual Accounts:');
            totalBalance = result.total_balance;
        }
        console.log(`Name: ${result.accounts.name}, Balance: ${result.accounts.balance}`);
    });

}

async function main() {
    try {
        // Establish connection to database.
        await client.connect();
        console.log('Connection status: [Established]');

        await printMatch(client, 900);
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
        console.log('Connection status: [Closed]');
    }
}

main();