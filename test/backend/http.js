const chai = require('chai');
const chaiHttp = require('chai-http');
const portfinder = require('portfinder');
const { dirname, resolve } = require('path');

const { app } = require('../../dist/nodejs/backend/app');
const { buildUrl } = require('../../dist/nodejs/backend/buildurl');

chai.use(chaiHttp);

const { expect } = chai;

const bindaddress = '127.0.0.1';
const notebookspath = resolve(dirname(__filename) + '/../fixtures/notebooks');

const validNotebook = 'Javascript';
const validNotebookRelativeUrl = buildUrl('notebook', { name: validNotebook });

describe('http service', function () {

    let port;
    let homeurl;
    let notebookUrl;
    let service;

    before(done => {
        portfinder.getPort(async function (err, freeport) {

            if (err) throw err;
            port = freeport;
            baseurl = 'http://' + bindaddress + ':' + port;
            homeurl = baseurl;
            notebookUrl = baseurl + validNotebookRelativeUrl;

            service = await app({
                port,
                bindaddress: '127.0.0.1',
                notebookspath,
                docker: false,
                logger: () => {},
            });

            done();
        });
    });

    it('should listen', async function () {
        expect(service.listening).to.equal(true);
    });

    it('should serve home with proper notebook', async function () {
        await new Promise(resolve => chai
            .request(homeurl)
            .get('/')
            .end((err, res) => {
                expect(err).eq(null);
                expect(res).has.status(200);

                expect(res.text).contains(validNotebook);
                expect(res.text).contains(validNotebookRelativeUrl);

                resolve();
            })
        );
    });

    it('should serve notebook', function (done) {
        chai
            .request(notebookUrl)
            .get('/')
            .end((err, res) => {
                expect(err).eq(null);
                expect(res).has.status(200);

                expect(res.text).matches(/,e="notebook",/g);
                expect(res.text).contains('"content":"console.log(\'Hello, World!\');"');

                expect(res.text).contains(validNotebook);

                done();
            });
    });
    
    it('should close cleanly', async function () {
        await new Promise(resolve => service.close(resolve));
        expect(service.listening).to.equal(false);
    });
});