const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//middle ware

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ngj4j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const verifyJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorised access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


async function run() {
    try {
        await client.connect();
        const toolCollection = client.db('tools').collection('collection');
        const bookingCollection = client.db('tools').collection('bookings');
        const customerCollection = client.db('tools').collection('allbook');
        const personCollection = client.db('tools').collection('person');
        const paymentCollection = client.db('tools').collection('payment');
        const userCollection = client.db('tools').collection('users');

        app.get("/data", async (req, res) => {
            const query = {};
            const cursor = toolCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);

        })
        app.get("/review", async (req, res) => {
            const query = {};
            const cursor = customerCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);

        })
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token })
        })
        app.put('/user/:admin/:email', async (req, res) => {
            const email = req.params.email;
            
            const filter = { email: email };
            
            const updatedDoc = {
                $set: {role:'admin'},
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            
            res.send({ result})
        })
        app.get("/data/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await toolCollection.findOne(query);
            res.send(result)
        })
        app.post('/booking', async (req, res) => {
            const book = req.body;
            const query = { booking: book.booking, buyer: book.buyer, name: book.name, price: book.price }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, book: exists })
            }
            const result = await bookingCollection.insertOne(book);
            res.send({ success: true, result })
        })
        app.get('/booking', verifyJwt, async (req, res) => {
            const buyer = req.query.buyer;
            const authorization = req.headers.authorization;
            const decodedEmail = req.decoded.email;
            if (buyer === decodedEmail) {
                const query = { buyer: buyer };
                const orders = await bookingCollection.find(query).toArray();
                return res.send(orders)

            }
            else {
                return res.status(403).send({ message: 'forbidden access' })

            }

        })
        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking)
        })
        app.get('/user', verifyJwt ,async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
        })
        //post reviews in ui
        app.post('/review', async (req, res) => {
            const newUser = req.body;
            const result = await customerCollection.insertOne(newUser);
            res.send(result)
        })
        app.patch('/booking/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId

                }
            }
            const updatedBooking = await bookingCollection.updateOne(filter, updatedDoc);
            const result = await paymentCollection.insertOne(payment)
            res.send(updatedDoc)


        })
        app.post('/create-payment-intent', async (req, res) => {
            const service = req.body;
            const price = service.price;
            const amount = parseInt(price) * 100;
            console.log("amount", amount);
            if (!isNaN(amount)) {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd',
                    payment_method_types: ['card']
                });
                res.send({ clientSecret: paymentIntent.client_secret })

            }


        });



        //root
        app.get('/', (req, res) => {
            res.send("hello i can learn code");
        })
        app.post('/person', async (req, res) => {
            const person = req.body;
            const result = await personCollection.insertOne(person);
            res.send(result)
        })

    }
    finally {
        //await client.close()


    }
}
run().catch(console.dir);




app.listen(port, () => {
    console.log('singing', port)
})

