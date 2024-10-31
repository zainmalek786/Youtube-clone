import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        typeof: Schema.Types.ObjectId,
        ref:"User"
    },
    Channel:{
        typeof: Schema.Types.ObjectId,
        ref:"User"
    },
},
{timestamps:true}
)

const Subscription = mongoose.model("Subscription",subscriptionSchema)