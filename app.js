const express         = require('express');
const bodyParser      = require('body-parser');
const gqlHTTP         = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose        = require('mongoose');
const argon2          = require('argon2');

const Event = require('./models/event');
const User  = require('./models/user');

const app = express();

app.use(bodyParser.json());

app.use('/api', gqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: User!
        }

        type User {
            _id: ID!
            email: String!
            password: String,
            createdEvents: [Event!]
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput:UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: async () => {
            try {
                const events = await Event.find().populate('creator');
                return events.map(event => {
                    return { ...event._doc };
                });
            }
            catch (err) {
                throw err;
            }
        },
        users: async () => {
            try {
                const users = await User.find();
                return users.map(user => {
                    return { ...user._doc };
                })
            } catch (err) {
                throw err;
            }
        },
        createEvent: async args => {
            try {
                const user = await User.findById('5c611ac98b16634a802af2bb');

                if (!user) throw new Error('Unauthorized user.');

                const event = new Event({
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(),
                    creator: '5c611ac98b16634a802af2bb'
                });
    
                const result = await event.save();

                await user.createdEvents.push(event).save();

                return { ...result._doc };
            }
            catch (err) {
                throw err;
            }
        },
        createUser: async args => {
            try {
                const user = await User.findOne({ email: args.userInput.email });
                
                if (user) throw new Error('User already exists.'); 

                const pwd_hash = await argon2.hash(args.userInput.password);

                const new_user = new User({
                    email: args.userInput.email,
                    password: pwd_hash
                });
    
                const result = await new_user.save();
                return { ...result._doc, password: null };
            }
            catch (err) {
                throw err;
            }
        }
    },
    graphiql: true
}));

mongoose.connect(process.env.MONGO_DB)
    .then(() => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    })