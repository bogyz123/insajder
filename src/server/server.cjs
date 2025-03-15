const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(cors());

mongoose
  .connect(
    "mongodb+srv://bogdandjakovic123:xxxxxx@insajdercluster.hpjtu.mongodb.net/insiderDb?retryWrites=true&w=majority&appName=insajderCluster"
  )
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch((err) => console.log("Connection error:", err));

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String },
    tier: { type: String },
    defaultCurrency: String,
    statistics: {
      totalBets: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalLosses: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      totalProfit: { type: Number, default: 0 },
      initialInvestment: { type: Number, default: null },

      monthlyStats: {
        type: [
          {
            month: { type: String, required: true },
            totalBets: { type: Number, default: 0 },
            totalWins: { type: Number, default: 0 },
            totalLosses: { type: Number, default: 0 },
            monthlyProfit: { type: Number, default: 0 },
            bets: { type: Array, default: [] },
          },
        ],
        default: months.map((month) => ({
          month,
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          monthlyProfit: 0,
          bets: [],
        })),
      },

      avgBetAmount: { type: Number, default: 0 },
      averageReturnOnInvestment: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const TipSchema = new mongoose.Schema({
  tipTitle: String,
  analysis: String,
  tip: String,
  type: String,
  active: Boolean,
});
const User = mongoose.model("User", UserSchema);
const Tip = mongoose.model("Tip", TipSchema);
const JWT_SECRET = "unlockstheworld.";

const verifyToken = (req, res, next) => {
  // middleware to verify jwt token
  const token = req.header("Authorization").replace("Bearer ", "");
  if (!token) {
    return res
      .status(401)
      .json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Doslo je do greske. Probajte se ponovo ulogovati." });
  }
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email, password: password }).lean();

  if (!user) {
    return res.status(404).json({ message: "Pogresan email ili sifra." });
  }
  const payload = { userId: user._id, email: user.email, tier: user.tier };
  const token = jwt.sign(payload, JWT_SECRET);
  res.send({ token });
});
app.post("/register", async (req, res) => {
  const { email, password, username, defaultCurrency } = req.body;
  if (email && password && username && defaultCurrency) {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Taj email se vec koristi." });
      }
      const newUser = new User({
        email,
        password: password,
        username,
        defaultCurrency: defaultCurrency,
        tier: "free",
        statistics: {
          totalBets: 0,
          totalWins: 0,
          totalLosses: 0,
          winRate: 0,
          totalProfit: 0,
          initialInvestment: null,
          monthlyStats: [
            {
              month: "January",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "February",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "March",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "April",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "May",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "June",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "July",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "August",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "September",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "October",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "November",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
            {
              month: "December",
              totalBets: 0,
              totalWins: 0,
              totalLosses: 0,
              monthlyProfit: 0,
            },
          ],
          avgBetAmount: 0,
          averageReturnOnInvestment: 0,
        },
      });
      await newUser.save();
      res.status(201).json({ message: "Registracija uspesna!" });
    } catch (err) {
      res.status(500).json({ message: "Doslo je do greske sa registracijom." });
    }
  } else {
    return res
      .status(401)
      .json({ message: "Doslo je do greske. Unesite svako polje." });
  }
});
app.get("/user", verifyToken, async (req, res) => {
  // fetches the current user provided by the verifyToken middleware
  try {
    const userData = await User.findById(req.user.userId).select("-password");
    res.status(200).json({ user: userData });
  } catch (err) {}
});
app.get("/tips/free/:amount", (req, res) => {
  // gets free betting tips with the specified amount
  const amount = req.params.amount;
  Tip.find({ type: "free", active: true })
    .limit(Number(amount))
    .then((tips) => {
      if (!tips) {
        return res
          .status(404)
          .json({ message: "Nije pronadjen ni jedan besplatan tip." });
      }
      res.json(tips);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Greska do servera." });
    });
});

app.get("/tips/premium/:amount", verifyToken, (req, res) => {
  const decodedJWT = req.user;
  const amount = req.params.amount;

  if (decodedJWT.tier !== "premium" && decodedJWT.tier !== "lite") {
    return res.status(403).json({ message: "Nemate pristup ovim tipovima." });
  }

  Tip.find({ type: "premium", active: true })
    .limit(Number(amount))
    .then((tips) => {
      if (!tips.length) {
        return res
          .status(404)
          .json({ message: "Trenutno nema aktivnih premium tipova." });
      }
      res.json(tips);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Greska do servera." });
    });
});
const StatisticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalBets: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
    totalLosses: {
      type: Number,
      default: 0,
    },
    winRate: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    initialInvestment: {
      type: Number,
      default: null,
    },
    monthlyStats: [
      {
        month: {
          type: String,
        },
        totalBets: {
          type: Number,
          default: 0,
        },
        totalWins: {
          type: Number,
          default: 0,
        },
        totalLosses: {
          type: Number,
          default: 0,
        },
        monthlyProfit: {
          type: Number,
          default: 0,
        },
      },
    ],
    avgBetAmount: {
      type: Number,
      default: 0,
    },
    averageReturnOnInvestment: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
const Statistics = mongoose.model("Statistics", StatisticsSchema);

app.get("/statistics/:user", verifyToken, async (req, res) => {
  const { user } = req.params; // user who they tried to request statistics on
  if (!user) {
    return res
      .status(400)
      .json({ message: "Doslo je do greske. Molimo prijavite nasoj podrsci." });
  }

  const actualUserId = req.user.userId; // JWT user id
  try {
    const actualUser = await User.findById(actualUserId);
    if (!actualUser) {
      return res.status(404).json({ message: "Korisnik nije pronadjen." });
    }
    if (user !== actualUser.username) {
      return res
        .status(403)
        .json({ message: "Nemate pristup ovom korisniku." });
    }
    const statistics = await User.findOne({ _id: actualUserId });

    return res.status(200).json(statistics);
  } catch (err) {}
});
app.put("/updateCapital", verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const initialInvestment = req.body.initialInvestment;
  if (!userId || !initialInvestment) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }

  try {
    await User.findByIdAndUpdate(userId, {
      $set: { "statistics.initialInvestment": initialInvestment },
    });
    return res.status(200).json({ message: "Uspesno!" });
  } catch (err) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }
});
app.put("/updateStatistics", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { updates } = req.body;
  console.log(updates);

  if (!userId || !updates || !Array.isArray(updates)) {
    return res.status(400).json({ message: "Doslo je do greske sa serverom." });
  }

  try {
    for (const update of updates) {
      const { updatePath, newValue, increment, push } = update;

      if (!updatePath.startsWith("statistics")) {
        return res
          .status(400)
          .json({ message: "Invalid path. Must be under .statistics." });
      }

      if (push) {
        if (newValue && Object.keys(newValue).length > 0) {
          // Make sure newValue is not empty or null
          const pushUpdate = { [updatePath]: newValue };
          await User.findByIdAndUpdate(userId, { $push: pushUpdate });
        } else {
          console.log(
            "New value is empty or invalid, skipping push operation."
          );
        }
      } else if (increment) {
        const incrementUpdate = { [updatePath]: newValue };
        await User.findByIdAndUpdate(userId, { $inc: incrementUpdate });
      } else {
        const setUpdate = { [updatePath]: newValue };
        await User.findByIdAndUpdate(userId, { $set: setUpdate });
      }
    }

    return res.status(200).json({ message: "Successfully updated." });
  } catch (err) {
    console.error("Error updating statistics:", err);
    return res
      .status(500)
      .json({ message: "Server error while updating stats." });
  }
});
app.put("/updateBet", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { betId, date, newStatus, isParlay } = req.body.bet;

  // Input validation
  if (!betId || !date || !newStatus) {
    return res.status(400).json({ message: "Missing required parameters." });
  }

  const [month, day] = date.split("/");

  try {
    const getUser = await User.findById(userId);

    if (!getUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const daybets = getUser.statistics?.monthlyStats[month - 1]?.bets[day];

    if (!daybets) {
      return res
        .status(406)
        .json({ message: "No bets found for the given date." });
    }

    const betToUpdate = daybets.find((bet) =>
      isParlay ? bet[0]?.parlayId === betId : bet?.betId === betId
    );

    if (!betToUpdate) {
      return res
        .status(404)
        .json({ message: `Bet with ID ${betId} not found.` });
    }

    // Update the bet status based on whether it's a parlay or single bet
    if (isParlay) {
      betToUpdate[0].status = newStatus; // parlay status
    } else {
      betToUpdate.status = newStatus; //  single bet outcome
    }

    getUser.markModified("statistics.monthlyStats");

    await getUser.save();

    return res.status(200).json({
      message: "Bet status updated successfully!",
      betId: betId,
      newStatus: newStatus,
    });
  } catch (err) {
    console.error("Error updating bet status:", err);
    return res.status(500).json({
      message: "Server error while updating bet status.",
      errorDetails: err.message,
    });
  }
});

app.get("/");
app.listen(1337, () => console.log("Listening on port 1337."));
