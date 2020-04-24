const request = require("request-promise");
const fs = require("fs-extra").promises;
const path = require("path");

const api_url = "https://passport.bilibili.com/web/generic/check/nickname";
const retry_times = 3;
const range = {begin: 0, end: 20005};

async function main() {
    let used_file = await fs.open(path.join(__dirname, "used.txt"), "w");
    let unused_file = await fs.open(path.join(__dirname, "unused.txt"), "w");
    let error_file = await fs.open(path.join(__dirname, "error.txt"), "w");
    let count_used = 0, count_unused = 0;
    for (let i = range.begin; i <= range.end; i++) {
        if (i % 100 === 0) console.log(`running on 御坂${i}号`);
        let t = 0;
        while (true) {
            try {
                let res = await request.get({
                    uri: api_url,
                    qs: {nickName: `御坂${i}号`},
                    json: true,
                    timeout: 10000
                });
                if (res.message === "昵称已存在") {
                    count_used++;
                    if (count_used % 10) {
                        await used_file.write(`御坂${i}号 `);
                    } else {
                        await used_file.write(`御坂${i}号\n`);
                    }
                } else {
                    count_unused++;
                    if (count_unused % 10) {
                        await unused_file.write(`御坂${i}号 `);
                    } else {
                        await unused_file.write(`御坂${i}号\n`);
                    }
                }
                break;
            } catch (e) {
                console.log(`error on 御坂${i}号`);
                t++;
                if (t <= retry_times) {
                    console.log(`retrying... (${t})`);
                } else {
                    console.error(e);
                    await error_file.write(`御坂${i}号\n`);
                    break;
                }
            }
        }

    }
    await used_file.write("\n\n共计" + count_used + "位御坂");
    await unused_file.write("\n\n共计" + count_unused + "位御坂");
    await used_file.close();
    await unused_file.close();
    await error_file.close();
}

let running = main();