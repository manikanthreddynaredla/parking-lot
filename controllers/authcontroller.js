const pool = require('../config/db');

const authLog = (level, event, details = {}) => {
  const payload = {
    time: new Date().toISOString(),
    module: 'authcontroller',
    event,
    ...details,
  };

  const message = `[authcontroller] ${event} ${JSON.stringify(payload)}`;

  if (level === 'error') {
    console.error(message);
    return;
  }

  if (level === 'warn') {
    console.warn(message);
    return;
  }

  console.log(message);
};

const getRequestMeta = (req) => ({
  method: req.method,
  path: req.originalUrl || req.url,
  ip: req.ip,
  userAgent: req.get('user-agent'),
});

const getErrorDetails = (err) => ({
  message: err.message,
  code: err.code,
  stack: err.stack,
});

const loginUser = async (req, res) => {
  const { lot_id, user_id, password } = req.body;
  const requestMeta = getRequestMeta(req);

  authLog('info', 'login.request.received', {
    ...requestMeta,
    lot_id,
    user_id,
    hasPassword: Boolean(password),
  });

  try {
    if (!lot_id || !user_id || !password) {
      authLog('warn', 'login.validation.failed', {
        ...requestMeta,
        lot_id,
        user_id,
        missingFields: {
          lot_id: !lot_id,
          user_id: !user_id,
          password: !password,
        },
      });

      return res.status(400).json({ message: 'Missing required fields' });
    }

    authLog('info', 'login.user.lookup.started', {
      lot_id,
      user_id,
    });

    const checkQuery = `
      SELECT * FROM users WHERE lot_id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [lot_id, user_id]);

    authLog('info', 'login.user.lookup.finished', {
      lot_id,
      user_id,
      rowCount: checkResult.rows.length,
    });

    if (checkResult.rows.length === 0) {
      authLog('warn', 'login.user.not_found', {
        lot_id,
        user_id,
      });

      return res.status(401).json({ message: 'Invalid user' });
    }

    const user = checkResult.rows[0];

    if (user.password !== password) {
      authLog('warn', 'login.password.invalid', {
        lot_id,
        user_id,
      });

      return res.status(401).json({ message: 'Invalid password' });
    }

    authLog('info', 'login.success', {
      lot_id: user.lot_id,
      user_id: user.user_id,
      password,
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        lot_id: user.lot_id,
        user_id: user.user_id,
      },
    });
  } catch (err) {
    authLog('error', 'login.error', {
      ...requestMeta,
      lot_id,
      user_id,
      error: getErrorDetails(err),
    });

    return res.status(500).json({ error: err.message });
  }
};

const checkin = async (req, res) => {
  const { lot_id, vehicle_no, four_no } = req.body;
  const requestMeta = getRequestMeta(req);

  authLog('info', 'checkin.request.received', {
    ...requestMeta,
    lot_id,
    vehicle_no,
    hasFourNo: Boolean(four_no),
  });

  try {
    if (!lot_id || !vehicle_no || !four_no) {
      authLog('warn', 'checkin.validation.failed', {
        ...requestMeta,
        lot_id,
        vehicle_no,
        missingFields: {
          lot_id: !lot_id,
          vehicle_no: !vehicle_no,
          four_no: !four_no,
        },
      });

      return res.status(400).json({ message: 'Missing fields' });
    }

    authLog('info', 'checkin.vehicle.lookup.started', {
      lot_id,
      vehicle_no,
    });

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

    authLog('info', 'checkin.vehicle.lookup.finished', {
      lot_id,
      vehicle_no,
      rowCount: checkResult.rows.length,
    });

    if (checkResult.rows.length > 0) {
      authLog('warn', 'checkin.vehicle.already_exists', {
        lot_id,
        vehicle_no,
      });

      return res.json({ message: 'Vehicle already exists please check out' });
    }

    authLog('info', 'checkin.vehicle.insert.started', {
      lot_id,
      vehicle_no,
    });

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

    authLog('info', 'checkin.success', {
      lot_id,
      vehicle_no,
      insertedVehicleNo: insertResult.rows[0]?.vehicle_no,
      timestamp: insertResult.rows[0]?.timestamp,
    });

    return res.status(201).json({
      message: 'vehicle checked in successfully',
      data: insertResult.rows[0],
    });
  } catch (err) {
    authLog('error', 'checkin.error', {
      ...requestMeta,
      lot_id,
      vehicle_no,
      error: getErrorDetails(err),
    });

    return res.status(500).json({ error: err.message });
  }
};

const checkout = async (req, res) => {
  const { lot_id, vehicle_no, four_no } = req.body;
  const requestMeta = getRequestMeta(req);

  authLog('info', 'checkout.request.received', {
    ...requestMeta,
    lot_id,
    vehicle_no,
    hasFourNo: Boolean(four_no),
  });

  try {
    if (!lot_id || !vehicle_no || !four_no) {
      authLog('warn', 'checkout.validation.failed', {
        ...requestMeta,
        lot_id,
        vehicle_no,
        missingFields: {
          lot_id: !lot_id,
          vehicle_no: !vehicle_no,
          four_no: !four_no,
        },
      });

      return res.status(400).json({ message: 'Missing fields' });
    }

    authLog('info', 'checkout.vehicle.lookup.started', {
      lot_id,
      vehicle_no,
    });

    const checkQuery = `
      SELECT * FROM vehicle
      WHERE lot_id = $1 AND vehicle_no = $2
    `;

    const checkResult = await pool.query(checkQuery, [lot_id, vehicle_no]);

    authLog('info', 'checkout.vehicle.lookup.finished', {
      lot_id,
      vehicle_no,
      rowCount: checkResult.rows.length,
    });

    if (checkResult.rows.length === 0) {
      authLog('warn', 'checkout.vehicle.not_found', {
        lot_id,
        vehicle_no,
      });

      return res.status(404).json({ message: 'Vehicle not checked in' });
    }

    const vehicle = checkResult.rows[0];

    if (vehicle.four_no !== four_no) {
      authLog('warn', 'checkout.four_no.invalid', {
        lot_id,
        vehicle_no,
      });

      return res.status(401).json({ message: 'Invalid 4-digit number' });
    }

    const checkinTime = new Date(vehicle.timestamp);
    const checkoutTime = new Date();
    const diffMs = checkoutTime - checkinTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    authLog('info', 'checkout.duration.calculated', {
      lot_id,
      vehicle_no,
      checkinTime: checkinTime.toISOString(),
      checkoutTime: checkoutTime.toISOString(),
      durationMinutes: diffMinutes,
    });

    authLog('info', 'checkout.vehicle.delete.started', {
      lot_id,
      vehicle_no,
    });

    await pool.query(
      `DELETE FROM vehicle WHERE lot_id = $1 AND vehicle_no = $2`,
      [lot_id, vehicle_no]
    );

    authLog('info', 'checkout.success', {
      lot_id,
      vehicle_no,
      durationHours: diffHours,
      durationRemainingMinutes: diffMinutes % 60,
    });

    return res.status(200).json({
      message: 'Checkout successful',
      duration: {
        hours: diffHours,
        minutes: diffMinutes % 60,
      },
      checkin_time: checkinTime,
      checkout_time: checkoutTime,
    });
  } catch (err) {
    authLog('error', 'checkout.error', {
      ...requestMeta,
      lot_id,
      vehicle_no,
      error: getErrorDetails(err),
    });

    return res.status(500).json({ error: err.message });
  }
};

module.exports = { loginUser, checkin, checkout };
