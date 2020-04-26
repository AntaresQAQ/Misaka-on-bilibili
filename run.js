const request = require("request-promise");
const fs = require("fs-extra").promises;
const path = require("path");
const moment = require("moment");
const tmp = require("tmp-promise");

const retry_times = 3;
const range = {begin: 0, end: 20005};

Number.prototype.pad = function (size) {
    let s = String(this);
    while (s.length < (size || 5)) {
        s = "0" + s;
    }
    return s;
}

async function check(nickname) {
    let t = 0;
    while (true) {
        try {
            let res = await request.get({
                uri: "https://passport.bilibili.com/web/generic/check/nickname",
                qs: {nickName: nickname},
                json: true,
                timeout: 10000,
                header: {
                    "Accept": "application/json, text/plain, */*",
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) " +
                        "AppleWebKit/537.36 (KHTML, like Gecko) " +
                        "Chrome/81.0.4044.122 Safari/537.36",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "zh-CN,zh;q=0.9"
                }
            });
            return res.message === "昵称已存在";
        } catch (err) {
            console.log(`error on ${nickname}`);
            t++;
            if (t <= retry_times) {
                console.log(`retrying... (${t})`);
            } else {
                throw err;
            }
        }
    }
}

async function main() {
    let tmp_dir = await tmp.dir();
    let used_file = await fs.open(path.join(tmp_dir.path, "used.txt"), "w");
    let unused_file = await fs.open(path.join(tmp_dir.path, "unused.txt"), "w");
    let error_file = await fs.open(path.join(tmp_dir.path, "error.txt"), "w");

    let has_error = false;
    let count_used = 0, count_unused = 0;
    for (let i = range.begin; i <= range.end; i++) {
        let nickname = `御坂${i}号`;
        if (i % 100 === 0) console.log(`running on ${nickname}`);
        try {
            if (await check(nickname)) {
                count_used++;
                if (count_used % 10) {
                    await used_file.write(nickname + ' ');
                } else {
                    await used_file.write(nickname + '\n');
                }
            } else {
                count_unused++;
                if (count_unused % 10) {
                    await unused_file.write(nickname + ' ');
                } else {
                    await unused_file.write(nickname + '\n');
                }
            }
        } catch (err) {
            has_error = true;
            console.error(err);
            await error_file.write(nickname + '\n');
        }
    }

    await used_file.write("\n\n规则命名共计" + count_used + "位御坂妹妹\n\n");
    await unused_file.write("\n\n规则命名共计" + count_unused + "位御坂妹妹\n\n");

    let count_used_special = 0, count_unused_special = 0;
    for (let i = range.begin; i <= Math.min(9999, range.end); i++) {
        let nickname = `御坂${i.pad(5)}号`;
        if (i % 100 === 0) console.log(`running on ${nickname}`);
        try {
            if (await check(nickname)) {
                count_used++;
                count_used_special++;
                if (count_used_special % 10) {
                    await used_file.write(nickname + ' ');
                } else {
                    await used_file.write(nickname + '\n');
                }
            } else {
                count_unused++;
                count_unused_special++
                if (count_unused_special % 10) {
                    await unused_file.write(nickname + ' ');
                } else {
                    await unused_file.write(nickname + '\n');
                }
            }
        } catch (err) {
            has_error = true;
            console.error(err);
            await error_file.write(nickname + '\n');
        }
    }
    await used_file.write("\n\n特殊命名共计" + count_used_special + "位御坂妹妹\n\n");
    await unused_file.write("\n\n特殊命名共计" + count_unused_special + "位御坂妹妹\n\n");

    await used_file.write("\n\n共计" + count_used + "位御坂妹妹");
    await unused_file.write("\n\n共计" + count_unused + "位御坂妹妹");

    await used_file.close();
    await unused_file.close();
    await error_file.close();

    let result_path = path.join(__dirname, "result", moment().format("YYYY-MM-DD HH-mm-ss"));
    await fs.mkdir(result_path, {recursive: true});
    await fs.rename(path.join(tmp_dir.path, "used.txt"), path.join(result_path, "used.txt"));
    await fs.rename(path.join(tmp_dir.path, "unused.txt"), path.join(result_path, "unused.txt"));
    if (has_error) {
        await fs.rename(path.join(tmp_dir.path, "error.txt"), path.join(result_path, "error.txt"));
    } else {
        await fs.unlink(path.join(tmp_dir.path, "error.txt"));
    }
    await tmp_dir.cleanup();
}

let running = main();