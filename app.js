const express=require('express');
const bodyParser=require('body-parser');
const {graphqlHTTP}=require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose =require('mongoose');
const bcrypt=require('bcryptjs');

const Event =require('./models/events');
const User=require('./models/user');

const app=express();

app.use(bodyParser.json());

const schema=buildSchema(`
    
    type Event{
        _id:ID!
        title:String!
        price:Float!
        description:String!
        date:String!
    }

    type User{
        _id:ID!
        email:String!
        password:String
    }

    input EventInput{
        title:String!
        price:Float!
        description:String!
        date:String!
    }

    input UserInput{
        email:String!
        password:String!
    }

    type RootQuery{
        events:[Event!]!
    }

    type RootMutation{
        createEvent(eventInput:EventInput):Event
        createUser(userInput:UserInput):User
    }

    schema{
        query:RootQuery
        mutation:RootMutation
    }
`)

app.use('/graphql',graphqlHTTP({
    schema:schema,
    rootValue:{
        
        events:async()=> {
            // const res=await Event.find();
            // return res;

            return Event.find();
        },
        
        createEvent: args => {
            const event = new Event({
              title: args.eventInput.title,
              description: args.eventInput.description,
              price: +args.eventInput.price,
              date: new Date(args.eventInput.date),
              creator: '64d3adb59cf5ec828ed48282'
            });
            let createdEvent;
            return event
              .save()
              .then(result => {
                createdEvent = { ...result._doc, _id: result._doc._id.toString() };
                return User.findById('64d3adb59cf5ec828ed48282');
              })
              .then(user => {
                if (!user) {
                  throw new Error('User not found.');
                }
                user.createdEvents.push(event);
                return user.save();
              })
              .then(result => {
                return createdEvent;
              })
              .catch(err => {
                console.log(err);
                throw err;
              });
          },

        createUser:(args)=>{
            return User.findOne({email:args.userInput.email}).then(user=>{
                if(user){
                    throw new Error("User Exist Already");
                }
                return bcrypt.hash(args.userInput.password,12)
                .then(hashedPassword=>{
                    const user=new User({
                        email:args.userInput.email,
                        password:hashedPassword
                    });
                    return user.save()
                    .then(result=>{
                        return {...result._doc,password:null}
                    })
                })
            })
            .catch(err=>{
                throw err;
            })
        }
    },
    graphiql:true
}));

mongoose.connect('mongodb+srv://aryan:12345@cluster0.vwa7c.mongodb.net/events-react-dev?retryWrites=true&w=majority').then(()=>{
   app.listen(3000,()=>{
        console.log('started listening on port 3000');
    }); 
}).catch(error=>{
    console.log(error);
})
