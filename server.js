require('isomorphic-fetch');
const dotenv = require('dotenv');
const cors = require("cors")
dotenv.config();
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const app = express();
const Shopify = require('shopify-api-node');

const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true)
  },
  credentials: true,
}
app.use(cors(corsOptions));

const {
    SHOPIFY_ACCESS_TOKEN,
    SHOPNAME,
    HOST
} = process.env;

const shopify = new Shopify({
    shopName: SHOPNAME,
    accessToken: SHOPIFY_ACCESS_TOKEN
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//app.use(bodyParser.raw({type: 'application/json'}));
app.use(bodyParser.urlencoded({
    extended: true
}));

router.get('/', (req, res) => {
  res.send('Hello World!');
});

router.post('/customers', async (req, res) => {
    const customers = await shopify.customer.search({tag: req.body.tag});
    res.send(customers);
});

router.post('/orders', async (req, res) => {
    const customer_id = req.body.customer_id;
    const tag = req.body.tag;

    const customer = await shopify.customer.get(customer_id);
    if (!customer.tags || !customer.tags.includes(tag)) {
        res.send([]);
    }

    const orders = await shopify.customer.orders(customer_id, {status: 'any'});
    res.send(orders);
});

router.post('/order', async (req, res) => {
    const order_id = req.body.order_id;
    const tag = req.body.tag;

    const order = await shopify.order.get(order_id);

    const customer = await shopify.customer.get(order.customer.id);
    if (!customer.tags || !customer.tags.includes(tag)) {
        res.send([]);
    }

    for ( let index=0; index<order.line_items.length; index++ ) {
        let product = await shopify.product.get(order.line_items[index].product_id);
        if ( product.handle ) {
            order.line_items[index].product_handle = product.handle;
        }
    }
    res.send(order);
});

app.use('/', router);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});