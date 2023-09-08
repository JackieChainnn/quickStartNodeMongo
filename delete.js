const MongoClient = require('./connection');

//✅✅✅
async function deleteListingByName(client, nameOfListing) {
    const cached = await client.db('sample_airbnb').collection('listingsAndReviews').findOne({ name: nameOfListing });
    const cachedID = cached._id;
    console.log(`document with id: ${cachedID} will be deleted.`);
    const result = await client.db('sample_airbnb').collection('listingsAndReviews').deleteOne(
        { name: nameOfListing }
    )

    console.log(`Deleted document: ${result.deletedCount}`);
    if (result.deletedCount > 0) {
        console.log(`Deleted document id: ${cachedID}`);
    }
}

/**
 * Delete all listings that were last scraped prior to the given date
 * @param {MongoClient} client A MongoClient that is connected to a cluster with the sample_airbnb database
 * @param {Date} date The date to check the last_scraped property against
 */
async function deleteListingsFirstReviewBeforeDate(client, date) {
    const results = await client.db('sample_airbnb').collection('listingsAndReviews').deleteMany(
        { first_review: { $lt: date } }
    );

    console.log(`${results.deletedCount} document(s) was/were deleted.`);
}

//MAIN
async function main() {
    try {
        await deleteListingsFirstReviewBeforeDate(MongoClient, new Date('2014-01-23'));
    } catch (error) {
        console.error(error);
    } finally {
        await MongoClient.close();
        console.log('Closed connection.');
    }
}

main();
