const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 10000;
const ADMIN_PASSWORD = "Av98012@12";

const sessions = new Set();

// ============================================================
//  SIMPLE SERVER - JUST TO TEST
// ============================================================

function send(res, status, body) {
    res.writeHead(status, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end(JSON.stringify(body));
}

async function requestHandler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    console.log(`📡 ${req.method} ${url.pathname}`);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        });
        res.end();
        return;
    }

    // ============================================================
    //  HEALTH CHECK
    // ============================================================
    if (req.method === "GET" && url.pathname === "/api/health") {
        send(res, 200, {
            status: "ok",
            message: "Server is running!",
            timestamp: new Date().toISOString()
        });
        return;
    }

    // ============================================================
    //  PUBLIC API
    // ============================================================
    if (req.method === "GET" && url.pathname === "/api/public") {
        send(res, 200, {
            rooms: [],
            reviews: [],
            transports: []
        });
        return;
    }

    // ============================================================
    //  ADMIN LOGIN
    // ============================================================
    if (req.method === "POST" && url.pathname === "/api/admin/login") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            try {
                const data = JSON.parse(body);
                if (data.password === ADMIN_PASSWORD) {
                    const token = crypto.randomBytes(24).toString("hex");
                    sessions.add(token);
                    send(res, 200, { token });
                } else {
                    send(res, 401, { error: "Incorrect password" });
                }
            } catch (e) {
                send(res, 400, { error: "Invalid request" });
            }
        });
        return;
    }

    // ============================================================
    //  ADMIN DATA (needs token)
    // ============================================================
    if (req.method === "GET" && url.pathname === "/api/admin/data") {
        const auth = req.headers.authorization || "";
        const token = auth.replace("Bearer ", "");
        
        if (!sessions.has(token)) {
            send(res, 401, { error: "Unauthorized" });
            return;
        }

        send(res, 200, {
            rooms: { pending: [], approved: [], taken: [], declined: [], removed: [] },
            reviews: { pending: [], approved: [], declined: [] },
            reports: { pending: [], approved: [], declined: [] },
            transports: { pending: [], approved: [], declined: [], removed: [] },
            agents: { accounts: [], profiles: [], landlords: [], reports: [], leads: [], viewings: [], support: [] },
            receipts: []
        });
        return;
    }

    // ============================================================
    //  404 - Not Found
    // ============================================================
    send(res, 404, { error: "Not found" });
}

// ============================================================
//  START SERVER
// ============================================================
const server = http.createServer(requestHandler);

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔑 Admin password: ${ADMIN_PASSWORD}`);
    console.log(`✅ Health: http://localhost:${PORT}/api/health`);
    console.log(`✅ Public: http://localhost:${PORT}/api/public`);
});

server.on("error", (e) => {
    console.error("❌ Server error:", e);
});
