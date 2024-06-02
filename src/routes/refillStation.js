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