module.exports = {
    getRecipeForMainFilename,
    getGlobFileMatchingPatterns,
};

function getRecipeForMainFilename(filename) {
    const recipes = getRecipes();
    const recipe = recipes.find(recipe => recipe.mainfile.includes(filename));
    if (!recipe) return undefined;

    return recipe;
}

function getGlobFileMatchingPatterns(basepath) {
    const recipes = getRecipes();
    const filenames = [];
    recipes.forEach((value, index) => {
        value.mainfile.map(filename => filenames.push(filename));
    });

    return [basepath + '/**/{' + filenames.join(',') + '}'];
}

function getRecipes() {

    const recipes = [];

    recipes.push({
        key: 'nodejs',
        name: 'NodeJS',
        language: 'JavaScript',
        mainfile: ['index.js'],
        execLocal: ({ notebook }) => ([
            'node', '--harmony', notebook.absdir + '/' + notebook.mainfilename,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'node:alpine',
            'node', '/code/' + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'haskell',
        name: 'Haskell',
        language: 'Haskell',
        mainfile: ['main.hs'],
        execLocal: ({ notebook }) => ([
            'bash', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code ' + notebook.absdir + '/' + notebook.mainfilename + ' && /tmp/code',
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'haskell:latest',
            'sh', '-c', 'ghc -v0 -H14m -outputdir /tmp -o /tmp/code "/code/' + notebook.mainfilename + '" && /tmp/code',
        ]),
    });

    recipes.push({
        key: 'lua',
        name: 'Lua',
        language: 'Lua',
        mainfile: ['main.lua'],
        execLocal: ({ notebook }) => ([
            'lua', notebook.absdir + '/' + notebook.mainfilename,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'superpaintman/lua:latest',
            'lua', '/code/' + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'php',
        name: 'PHP',
        language: 'PHP',
        mainfile: ['main.php', 'index.php'],
        execLocal: ({ notebook }) => ([
            'php', notebook.absdir + '/' + notebook.mainfilename,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'php:latest',
            'php', '/code/' + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'go',
        name: 'Go',
        language: 'Go',
        mainfile: ['main.go'],
        execLocal: ({ notebook }) => ([
            'go', 'run', notebook.absdir + '/' + notebook.mainfilename,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'golang:latest',
            'go', 'run', '/code/' + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'java',
        name: 'Java',
        language: 'Java',
        mainfile: ['main.java'],
        execLocal: ({ notebook }) => ([
            'sh', '-c', 'javac -d /tmp ' + notebook.absdir + '/' + notebook.mainfilename + ' && cd /tmp && java Main',
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'java:latest',
            'sh', '-c', 'javac -d /tmp /code/' + notebook.mainfilename + ' && cd /tmp && java Main'
        ]),
    });

    recipes.push({
        key: 'python3',
        name: 'Python 3',
        language: 'Python',
        mainfile: ['main.py', 'index.py'],
        execLocal: ({ notebook }) => ([
            'python', notebook.absdir + '/' + notebook.mainfilename,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'python:3',
            'python', '/code/' + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'c',
        name: 'C11',
        language: 'C',
        mainfile: ['main.c'],
        execLocal: ({ notebook }) => ([
            'sh', '-c', "gcc -Wall -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'gcc:latest',
            'sh', '-c', "gcc -Wall -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
        ]),
    });

    recipes.push({
        key: 'ruby',
        name: 'Ruby',
        language: 'Ruby',
        mainfile: ['main.rb', 'index.rb'],
        execLocal: ({ notebook }) => ([
            'ruby', notebook.absdir + '/' + notebook.mainfilename,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'ruby:latest',
            'ruby', '/code/' + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'c++',
        name: 'C++14',
        language: 'C++',
        mainfile: ['main.cpp'],
        execLocal: ({ notebook }) => ([
            'sh', '-c', "g++ -std=c++14 -Wall -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'gcc:latest',
            'sh', '-c', "g++ -std=c++14 -Wall -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
        ]),
    });

    recipes.push({
        key: 'rust',
        name: 'Rust',
        language: 'Rust',
        mainfile: ['main.rs'],
        execLocal: ({ notebook }) => ([
            'sh', '-c', "rustc -o /tmp/code.out '" + notebook.abspath + "' && /tmp/code.out"
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'rust:latest',
            'sh', '-c', "rustc -o /tmp/code.out /code/" + notebook.mainfilename + " && /tmp/code.out"
        ]),
    });

    recipes.push({
        key: 'swift',
        name: 'Swift',
        language: 'Swift',
        mainfile: ['main.swift'],
        execLocal: ({ notebook }) => ([
            'swift', notebook.abspath,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'swift:latest',
            "swift", "/code/" + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'r',
        name: 'R',
        language: 'R',
        mainfile: ['main.r', 'main.R'],
        execLocal: ({ notebook }) => ([
            'Rscript', notebook.abspath,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'r-base:latest',
            "Rscript", "/code/" + notebook.mainfilename,
        ]),
    });

    recipes.push({
        key: 'plaintext',
        name: 'Plain text',
        mainfile: [],
        execLocal: ({ notebook }) => ([
            'cat', notebook.absdir + '/' + notebook.mainfilename,
        ]),
        execDocker: ({ notebook }) => ([
            'docker', 'run', '--rm',
            '-v', notebook.absdir + ':/code',
            'alpine:latest',
            'cat ', 'code/' + notebook.mainfilename,
        ]),
    });

    return recipes;
}
