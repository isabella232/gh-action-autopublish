const { Toolkit } = require('actions-toolkit');
const fs = require('fs');
const path = require('path');


Toolkit.run(async tools => {
    function getVersion() {
        const data = fs.readFileSync(path.join(tools.workspace, 'package.json'));

        return JSON.parse(data.toString()).version;
    }

    await tools.exec('git', ['config', 'user.name', '"Automated Release"']);
    await tools.exec('git', ['config', 'user.email', '"gh-action-autopublish@users.noreply.github.com"']);

    const currentVersion = getVersion();
    let tagExists;

    try {
        await tools.exec(`git ls-remote --exit-code --tags origin v${currentVersion}`);
        tagExists = true;
    } catch (e) {
        tagExists = false;
    }

    if (tagExists) {
        tools.log.info('Current version has a tag, bumping the patch');
        await tools.exec('npm version patch');
    } else {
        tools.log.info(`Current version does not have a tag, creating it`);
        await tools.exec(`git tag v${currentVersion}`);
    }

    await tools.exec('git push origin master');
    await tools.exec(`git push origin v${getVersion()}`);
    await tools.exec('npm whoami');
    await tools.exec('npm publish');

    tools.exit.success('Done!!')
}, { event: 'push' });
