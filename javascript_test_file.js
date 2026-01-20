const { loadEnvFile } = require('node:process');
loadEnvFile();

async function get_orders(base_url, ck, cs, quantity=10, timeDelay=2500){
    const url =
    `${base_url}/wp-json/wc/v3/orders` +
    `?per_page=${quantity}&order=desc&orderby=date` +
    `&consumer_key=${ck}` +
    `&consumer_secret=${cs}`;

    const response = await fetch(url);

    if (!response.ok) {
    console.error(await response.text());
    throw new Error(`HTTP ${response.status}`);
    }

    const orders = await response.json();
    let index = 0;
    for(order of orders){
        index++
        let payload = {
            "order_id": order["id"],
            "site_url": base_url
        }
        fetch("https://voksevaerket.app.n8n.cloud/webhook/fdfc8430-bcbf-42b6-9161-d8151cba696f", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            console.log(`Triggered Webhook number ${index} with order ID ${order["id"]}:`, response.statusText);
        })
        .catch(errors => {
            console.error("Error:", error);
        });
        await new Promise(r => setTimeout(r, timeDelay));
    }
}

get_orders("https://fambed.co.uk", process.env.UKck, process.env.UKcs, quantity=50, timeDelay=7500);
