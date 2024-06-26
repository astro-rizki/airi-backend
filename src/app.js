const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const { notFound, errorHandler } = require('./middlewares');

const app = express();

require('dotenv').config();

app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());

// const employees = require('./routes/employees');
const refillStation = require('./routes/refillStation');

// app.use('/api/employees', employees);
app.use('/api/v1', refillStation);

app.use(notFound);
app.use(errorHandler);

module.exports = app;