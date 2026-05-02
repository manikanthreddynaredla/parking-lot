const pool = require('../config/db');

const loginUser = async (req, res) => {
  try {
    const { lot_id, user_id, password } = req.body;

    // Validate input
    if (!lot_id || !user_id || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check user in DB
    const checkQuery = `
      SELECT * FROM users WHERE lot_id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [lot_id, user_id]);

    // ❌ FIX: use checkResult instead of result
    if (checkResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid user" });
    }

    const user = checkResult.rows[0];

    // Password check
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Success response
    return res.status(200).json({
      message: "Login successful",
      user: {
        lot_id: user.lot_id,
        user_id: user.user_id
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const checkin = async (req, res) => {
  const { lot_id, vehicle_no, four_no } = req.body;

  try {
    if (!lot_id || !vehicle_no || !four_no) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔍 Check if vehicle already exists
    const checkQuery = `
      SELECT v.vehicle_no, v.lot_id
      FROM vehicle v
      LEFT JOIN users u ON v.lot_id = u.lot_id
      WHERE v.lot_id = $1 
        AND v.vehicle_no = $2
        
        
    `;

    const checkResult = await pool.query(checkQuery, [
      lot_id,
      vehicle_no,
    ]);

    if (checkResult.rows.length > 0) {
      return res.json({ message: "Vehicle already exists please check out" });
    }

    // ➕ Insert if not exists
    const insertQuery = `
      INSERT INTO vehicle (lot_id, vehicle_no, four_no, timestamp)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;

    const insertResult = await pool.query(insertQuery, [
      lot_id,
      vehicle_no,
      four_no,
    ]);

    return res.status(201).json({
      message: "vehicle checked in successfully",
      data: insertResult.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
const checkout = async (req, res) => {
  const { lot_id, vehicle_no, four_no } = req.body;

  try {
    if (!lot_id || !vehicle_no || !four_no) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔍 1. Check if vehicle exists
    const checkQuery = `
      SELECT * FROM vehicle
      WHERE lot_id = $1 AND vehicle_no = $2
    `;

    const checkResult = await pool.query(checkQuery, [lot_id, vehicle_no]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not checked in" });
    }

    const vehicle = checkResult.rows[0];

    // 🔐 2. Verify four digit number
    if (vehicle.four_no !== four_no) {
      return res.status(401).json({ message: "Invalid 4-digit number" });
    }

    // ⏱️ 3. Calculate time difference
    const checkinTime = new Date(vehicle.timestamp);
    const checkoutTime = new Date();

    const diffMs = checkoutTime - checkinTime;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    // 🧹 (Optional) Delete record after checkout
    await pool.query(
      `DELETE FROM vehicle WHERE lot_id = $1 AND vehicle_no = $2`,
      [lot_id, vehicle_no]
    );

    return res.status(200).json({
      message: "Checkout successful",
      duration: {
        hours: diffHours,
        minutes: diffMinutes % 60,
      },
      checkin_time: checkinTime,
      checkout_time: checkoutTime,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



module.exports = { loginUser, checkin, checkout };
