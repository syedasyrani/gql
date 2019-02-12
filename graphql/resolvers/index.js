const argon2 = require('argon2');

const Event = require('../../models/event');
const User = require('../../models/user');
const Booking = require('../../models/booking');

const creator = async userId => {
    try {
        const creator_data = await User.findById(userId);

        return {
            ...creator_data._doc,
            createdEvents: multiEvents.bind(this, creator_data._doc.createdEvents)
        };
    } catch (err) {
        throw err;
    }
};

const singleEvent = async eventId => {
    try {
        const event_data = await Event.findById(eventId);

        return {
            ...event_data._doc,
            date: new Date(event_data._doc.date).toISOString(),
            creator: creator.bind(this, event_data._doc.creator)
        };
    } catch (err) {
        throw err;
    }
}

const multiEvents = async eventIds => {
    try {
        const events_data = await Event.find({
            _id: {
                $in: eventIds
            }
        });

        return events_data.map(event => {
            return {
                ...event._doc,
                date: new Date(event._doc.date).toISOString(),
                creator: creator.bind(this, event._doc.creator)
            };
        });
    } catch (err) {
        throw err;
    }
}

module.exports = {
    events: async () => {
        try {
            const events = await Event.find();
            return events.map(event => {
                return {
                    ...event._doc,
                    date: new Date(event._doc.date).toISOString(),
                    creator: creator.bind(this, event._doc.creator)
                };
            });
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

            return {
                ...result._doc,
                creator: creator.bind(this, result._doc.creator)
            };
        } catch (err) {
            throw err;
        }
    },
    updateEvent: async args => {
        const event = await Event.findById(args.eventInput._id);

        if (!event) throw new Error('Event not found');

        console.log('event data ====> ', event);
        console.log('input data ====> ', args.userInput);
        args.userInput.map(input => {
            console.log(input);
        });
    },
    deleteEvent: async args => {},
    bookings: async () => {
        try {
            const bookings = await Booking.find();

            return bookings.map(booking => {
                return {
                    ...booking._doc,
                    event: singleEvent.bind(this, booking._doc.event),
                    user: creator.bind(this, booking._doc.user),
                    createdAt: new Date(booking._doc.createdAt).toISOString(),
                    updatedAt: new Date(booking._doc.updatedAt).toISOString()
                }
            })
        } catch (err) {
            throw err;
        }
    },
    bookEvent: async args => {
        try {
            const event = await Event.findOne({
                _id: args.eventId
            });

            const booking = new Booking({
                event: event._id,
                user: '5c611ac98b16634a802af2bb',
            });

            const result = await booking.save();

            return {
                ...result._doc,
                event: singleEvent.bind(this, result._doc.event),
                user: creator.bind(this, result._doc.user),
                createdAt: new Date(booking._doc.createdAt).toISOString(),
                updatedAt: new Date(booking._doc.updatedAt).toISOString()
            };

        } catch (err) {
            throw err;
        }

    },
    cancelBooking: async args => {
        try {
            const booking = await Booking.findById(args.bookingId).populate('event');

            if (!booking) throw new Error('Booking not found');

            await Booking.deleteOne({
                _id: args.bookingId
            });

            return {
                ...booking.event._doc,
                creator: creator.bind(this, booking.event.creator)
            };
        } catch (err) {
            throw err;
        }
    },
    users: async () => {
        try {
            const users = await User.find();
            return users.map(user => {
                return {
                    ...user._doc,
                    createdEvents: multiEvents.bind(this, user._doc.createdEvents)
                };
            })
        } catch (err) {
            throw err;
        }
    },
    createUser: async args => {
        try {
            const user = await User.findOne({
                email: args.userInput.email
            });

            if (user) throw new Error('User already exists.');

            const pwd_hash = await argon2.hash(args.userInput.password);

            const new_user = new User({
                email: args.userInput.email,
                password: pwd_hash
            });

            const result = await new_user.save();
            return {
                ...result._doc,
                password: null
            };
        } catch (err) {
            throw err;
        }
    },
    updateUser: async args => {},
    deleteUser: async args => {}
}