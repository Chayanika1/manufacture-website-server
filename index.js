const express = require ('express');
const cors = require('cors');
require ('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middle ware

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ngj4j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
  try {
    await client.connect();
    const toolCollection = client.db('tools').collection('collection');
    const bookingCollection = client.db('tools').collection('bookings');
    const customerCollection = client.db('tools').collection('allbook');
    
    app.get("/data" ,async(req,res)=>{
      const query = {};
      const cursor = toolCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);

    })
    app.get("/review" ,async(req,res)=>{
      const query = {};
      const cursor = customerCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);

    })
    app.get("/data/:id" ,async(req,res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)};
      const result = await toolCollection.findOne(query);
      res.send(result)
    })
    app.post('/booking',async(req,res)=>{
      const book = req.body;
      const query = {booking:book.booking, buyer:book.buyer,name: book.name}
      const exists = await bookingCollection.findOne(query);
      if(exists){
        return res.send ({success:false, book:exists})
      }
      const result = await bookingCollection.insertOne(book);
      res.send({success:true,result})
    })
    app.get('/booking',async(req,res)=>{
      const buyer = req.query.buyer;
      const query = {buyer:buyer};
      const orders = await bookingCollection.find(query).toArray();
      res.send(orders)
    })
    //post reviews in ui
    app.post('/review',async(req,res)=>{
      const newUser = req.body;
      const result = await customerCollection.insertOne(newUser);
      res.send(result)
    })

    
    
    //root
    app.get('/',(req,res)=>{
      res.send("hello i can learn code");
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

