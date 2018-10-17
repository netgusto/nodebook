const GitHub = require('@octokit/rest');

(async () => {
    const octokit = GitHub();
    octokit.authenticate({
        type: 'token',
        token: '1ccf330e31697d905137fe613492ea78a31bb0cf'
    });

    let repos = [];

    let result;
    do {
        if (result) {
            result = await octokit.getNextPage(result);
        } else {
            result = await octokit.gists.getForUser({
                username: 'netgusto',
                per_page: 100
            });    
        }
        
        repos = [...repos, ...result.data];
    } while (octokit.hasNextPage(result));

    console.log(repos.map(r => r.files));

    // Readonly, public use
    // Read-Write => Save button (manual save) + Leave warning
    // Mention public/private in title
    // Rename => Rename gist
    // Execute => persist on disk, tmp folder
    // Adapt glob => match list of files
    // File browser

    console.log(repos
        .filter(r => !r.trucated)
        .sort((a, b) => a.updated_at < b.updated_at ? 1 : -1)
        .map(r => {
            // created_at: '2014-05-20T14:22:03Z',
            // updated_at: '2015-08-29T14:01:37Z',

            const title = r.description.trim() ? r.description.trim() : 'Untitled Gist';

            const updated_at = new Date(r.updated_at);
            return (r.public ? '[PUBLIC] ' : '[PRIVATE] ') + title + ' (' + updated_at.toISOString() + ')';
        })
    );
})();