const express = require('express');
const bodyParser = require('body-parser');
const gqlHTTP = require('express-graphql');
const mongoose = require('mongoose');

const gqlSchemas = require('./graphql/schemas/index');
const gqlResolvers = require('./graphql/resolvers/index');

const app = express();

app.use(bodyParser.json());

app.use('/api', gqlHTTP({
    schema: gqlSchemas,
    rootValue: gqlResolvers,
    graphiql: true
}));

mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    })