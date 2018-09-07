const chai = require('chai');
const chaiHttp = require('chai-http');
const portfinder = require('portfinder');
const { dirname, resolve } = require('path');

const { app } = require('../../src/backend/app');
const { buildUrl } = require('../../src/backend/buildurl');

chai.use(chaiHttp);

const { expect } = chai;

portfinder.getPort(function (err, port) {

    if (err) throw err;

    const bindaddress = '127.0.0.1';
    const baseurl = 'http://' + bindaddress + ':' + port;
    const homeurl = baseurl;
    const notebookspath = resolve(dirname(__filename) + '/../fixtures/notebooks');

    const validNotebook = 'My first notebook';
    const validNotebookRelativeUrl = buildUrl('notebook', { name: validNotebook });

    const notebookUrl = baseurl + validNotebookRelativeUrl;

    describe('http service on port ' + port, function () {

        const service = app({
            port,
            bindaddress: '127.0.0.1',
            notebookspath,
            execCommand: () => ['echo', '1'],
            logger: () => {},
        });

        it('should listen', function () {
            expect(service.listening).to.equal(true);
        });

        it('should serve home with proper notebook', function (done) {
            chai
                .request(homeurl)
                .get('/')
                .end((err, res) => {
                    expect(err).eq(null);
                    expect(res).has.status(200);

                    expect(res.text).contains(validNotebook);
                    expect(res.text).contains(validNotebookRelativeUrl);

                    done();
                });
        });

        it('should serve notebook', function (done) {
            chai
                .request(notebookUrl)
                .get('/')
                .end((err, res) => {
                    expect(err).eq(null);
                    expect(res).has.status(200);

                    expect(res.text).contains('route="notebook"');
                    expect(res.text).contains('"content":"console.log(\'OK\');"');

                    expect(res.text).contains(validNotebook);

                    done();
                });
        });
        
        it('should close cleanly', function () {
            service.close();
            expect(service.listening).to.equal(false);
        });
    });
});