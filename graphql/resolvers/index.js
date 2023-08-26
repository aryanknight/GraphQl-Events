const bcrypt=require('bcryptjs');
const jwt=require("jsonwebtoken");

const Event =require('../../models/events');
const User=require('../../models/user');
const Booking =require("../../models/booking");

const singleEvent=async eventId=>{
    try {
        const event=await Event.findById(eventId);
        return event
    } catch (error) {
        throw error;
    }
} 

const user=async userId=>{
    try {
        const user=await User.findById(userId);
        return user;
    } catch (error) {
        throw error;
    }
} 

module.exports={
        
    events:async()=> {
        // const res=await Event.find();
        // return res;

        return Event.find().populate('creator');
    },
    
    bookings:async(args,req)=>{
        if(!req.isAuth){
            throw new Error("Unauthenticated user");
        }
        try{
            const bookings=await Booking.find();
            return bookings.map(booking=>{
                console.log(booking?._id);
                return {
                    ...booking,
                    _id:booking.id,
                    event:singleEvent(booking?.event),
                    user:user(booking.user),
                    createdAt:new Date(booking.createdAt).toISOString(),
                    updatedAt:new Date(booking.updatedAt).toISOString()
                }
            })
        }catch(err){
            throw err;
        }
    },

    createEvent: (args,req) => {
        if(!req.isAuth){
            throw new Error("Unauthenticated user");
        }
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: req.userId
        });
        let createdEvent;
        return event
          .save()
          .then(result => {
            createdEvent = { ...result._doc, _id: result._doc._id.toString() };
            return User.findById(req.userId);
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
    },

    bookEvent:async (args,req)=>{
        if(!req.isAuth){
            throw new Error("Unauthenticated user");
        }
        const fetchedEvent=await Event.findOne({_id:args.eventId});
        // console.log(fetchedEvent)
        const booking=new Booking({
            user:req.userId,
            event:fetchedEvent
        });
        const result= await booking.save();
        console.log(result)
        return {...result,
            event:singleEvent(booking?.event),
            user:user(booking.user),
            createdAt:new Date(result.createdAt).toISOString(),
            updatedAt:new Date(result.updatedAt).toISOString()
        }
    },

    cancelBooking: async (args,req)=>{
        if(!req.isAuth){
            throw new Error("Unauthenticated user");
        }
        try{
            const booking=await Booking.findById(args.bookingId).populate('event');
            const event={
                ...booking.event._doc,
                _id: booking.event.id,
            };
            console.log(event);
            await Booking.deleteOne({_id:args.bookingId});
            return event;
        }catch{
            throw err;
        }
    },

    login:async({email,password})=>{
        const user= await User.findOne({email:email});
        if(!user){
            throw new Error("User does not exist");
        }

        const isEqual= await bcrypt.compare(password,user.password);
        if(!isEqual){
            throw new Error("Wrong Credentials");
        }

        const token=jwt.sign({userId:user.id , email:user.email} , "some", {
            expiresIn:'1h'
        });

        return{ userId:user.id, token:token,tokenExpiration:1};
    }
}