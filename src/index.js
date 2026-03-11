const express = require("express");
const { processGcsFinalizeEvent } = require("./processGcsFinalizeEvent");

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/", async (req, res) => {
    try {
        const ceType = req.header("ce-type") || req.header("Ce-Type");
        if (!ceType) return res.status(400).send("Missing ce-type header (CloudEvent).");

        const supported = new Set([
            "google.cloud.storage.object.v1.finalized",
            "google.cloud.storage.object.v1.finalize",
            "google.cloud.storage.object.finalize",
        ]);

        if (!supported.has(ceType)) {
            // Not an error—just not our event.
            return res.status(204).send(`Ignored event type: ${ceType}`);
        }

        await processGcsFinalizeEvent(req.body);
        return res.status(200).send("OK");
    } catch (err) {
        console.error(err);
        return res.status(500).send(err?.message || "Internal error");
    }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on :${port}`));