import mongoose , {Schema} from "mongoose";

const subscriptionSchema = new Schema(
    {
        subscriber:{ // the one who is subcribing a channel
            type:mongoose.Types.ObjectId, 
            ref:"User"
        },
        channel:{ // the one who is getting subscribed 
            type:mongoose.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }
);

export const Subscription = mongoose.model("Subscription",subscriptionSchema);