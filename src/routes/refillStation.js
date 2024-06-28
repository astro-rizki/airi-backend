/* eslint-disable consistent-return */
const express = require('express');
const db = require('../db/connection');

const router = express.Router();

router.get("/refillStation/:id", (request, response) => {
    const { id } = request.params;
    let queryStr = 'SELECT * FROM station WHERE terminal_id=\''+ id +"\'"
    
    db.query(queryStr, (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
   });
}); 

router.post("/useVoucher", async (request, response) => {
  console.log("Checking voucher: "+request.body.voucherCode)
  try {
    let queryStr = 'SELECT station_id FROM station WHERE terminal_id = $1';
    let terminalId = [request.body.terminalId];
    const result = await db.query(queryStr, terminalId);
    let stationId = result.rows[0].station_id;

    queryStr = 'SELECT * FROM voucher WHERE voucher_code = $1';
    let voucherCode = [request.body.voucherCode];
    
    const result_query = await db.query(queryStr, voucherCode);
    let voucher = result_query.rows[0];
    const now = new Date();

    // check is active AND is on date?
    if( voucher.voucher_status && now >= voucher.voucher_start_date && now <= voucher.voucher_end_date ){
      // create transaction
      queryStr = 'INSERT INTO transaction (station_id, status_payment, status_transaction) VALUES ( $1, \'00\', \'NF\') RETURNING transaction_id'
      const createTrx = await db.query(queryStr, [stationId]);
      const transactionId = createTrx.rows[0].transaction_id;

      // create usage
      queryStr = 'INSERT INTO voucher_usage (transaction_id, voucher_id) VALUES ($1, $2) RETURNING voucher_usage_id'
      const createUsage = await db.query(queryStr, [transactionId, voucher.voucher_id]);
      const usageId = createUsage.rows[0].voucher_usage_id;
      queryStr = 'UPDATE transaction SET voucher_usage_id=$1 where transaction_id=$2'
      await db.query(queryStr, [usageId, transactionId]);

      // check if it unlimited?
      if(voucher.voucher_type != 'U'){
        // set voucher not active
        queryStr = 'UPDATE voucher SET voucher_status = false WHERE voucher_id=$1'
        await db.query(queryStr, [voucher.voucher_id]);
      }
      // set machine on
      queryStr = 'UPDATE station SET station_refill_status = true WHERE station_id=$1'
      await db.query(queryStr, [stationId]);
      // response.status(200).send('Sukses menggunakan voucher');
    } else{
      // response.status(200).send('Voucher telah dipakai');
    }

    queryStr = 'SELECT * FROM station WHERE terminal_id=\''+ terminalId +"\'"
    
    db.query(queryStr, (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
   });
 } catch (error) {
     console.error('Error querying database:', error);
     response.status(500).send('Internal Server Error');
 }
});

router.post("/paymentDone", async (request, response) => {
   try {
      let queryStr = 'SELECT station_id FROM station WHERE terminal_id = $1';
      let values = [request.body.terminalId];
      
      const result_query = await db.query(queryStr, values);
      let stationId = result_query.rows[0].station_id;

      queryStr = 'INSERT INTO transaction (station_id, status_payment, status_transaction) VALUES ( $1, \'00\', \'NF\')'
      await db.query(queryStr, [stationId]);

      queryStr = 'UPDATE station SET station_refill_status = true WHERE station_id=$1'
      await db.query(queryStr, [stationId]);

      response.status(200).send('Success');
  } catch (error) {
      console.error('Error querying database:', error);
      response.status(500).send('Internal Server Error');
  }
});

router.post("/refillDone", async (request, response) => {
   try {
      let queryStr = 'SELECT station_id FROM station WHERE terminal_id = $1';
      let values = [request.body.terminalId];
      
      const result_query = await db.query(queryStr, values);
      let stationId = result_query.rows[0].station_id;

      queryStr = 'UPDATE transaction SET status_transaction = \'DF\' WHERE station_id = $1'
      await db.query(queryStr, [stationId]);

      queryStr = 'UPDATE station SET station_refill_status = false WHERE station_id=$1'
      await db.query(queryStr, [stationId]);

      response.status(200).send('Success');
  } catch (error) {
      console.error('Error querying database:', error);
      response.status(500).send('Internal Server Error');
  }
});

module.exports = router;