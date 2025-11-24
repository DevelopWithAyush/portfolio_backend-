import express from 'express';

const router = express.Router();

router.get("/contributions", async (req, res) => {
    const username = req.query.user; 
    console.log("username", username);
    const year = req.query.year || new Date().getFullYear();

    if (!username) return res.status(400).json({ error: "Username is required" });

    const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

    const variables = {
        login: username,
        from: `${year}-01-01T00:00:00Z`,
        to: `${year}-12-31T23:59:59Z`,
    };

    try {
        const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            },
            body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();
        if(data.status === 401){
            throw new ErrorHandler("Unauthorized", 401);
        }
        res.json(data.data.user.contributionsCollection.contributionCalendar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching GitHub data" });
    }
});  




export default router;