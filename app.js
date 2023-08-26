const express=require('express');
const bodyParser=require('body-parser');
const {graphqlHTTP}=require('express-graphql');
const mongoose =require('mongoose');

const graphQLSchema=require('./graphql/schema/index');
const graphQLResolvers=require('./graphql/resolvers/index');
const isAuth=require("./middleware/is-auth");

const app=express();

app.use(bodyParser.json());

app.use(isAuth);

app.use('/graphql',graphqlHTTP({
    schema:graphQLSchema,
    rootValue:graphQLResolvers,
    graphiql:true
}));

mongoose.connect('mongodb+srv://aryan:12345@cluster0.vwa7c.mongodb.net/events-react-dev?retryWrites=true&w=majority').then(()=>{
   app.listen(3000,()=>{
        console.log('started listening on port 3000');
    }); 
}).catch(error=>{
    console.log(error);
})
