#!/usr/bin/env node

let http = require('http')
let cheerio = require('cheerio')
let ora = require('ora')
let argv = require('yargs').argv
let _ = argv._.join(' ')

const spinner = ora('Translating...').start()

/**
 * encapsulation request
 */
class AsyncRequest {
    private domain: string

    constructor () {
        this.domain = 'http://dict.cn/'
    }

    /**
     * get
     */
    public get (url: string): Promise<http.IncomingMessage> {
        let promise = new Promise<http.IncomingMessage> (resolve => {
            http.get(encodeURI(`${this.domain}${url}`), res => {
                let { statusCode } = res

                if (statusCode !== 200) {
                    spinner.stop()
                    console.error(`Error: status code is ${statusCode}`)
                    res.resume()
                    return
                }

                let page = ''

                res.setEncoding('utf8')
                res.on('data', (chunk) => {
                    page += chunk
                })

                res.on('end', () => {
                    try {
                        resolve(page)
                    } catch (err) {
                        console.error(err)
                    }
                })
            }).on('error', (err) => {
                console.error(`Error: ${err.message}`)
            })
        })

        return promise
    }
}

/**
 * encapsulation data operations
 */
class Data {
    private $data: Array<{ type: string, translation: string, alias: string }>
    private lang: string

    constructor (str: string) {
        this.lang = this.detectLang(str)
    }

    /**
     * analyse data
     * @param str {String} - web page which is requested from AsyncRequest
     */
    public analyse (str: string) {
        let $ = cheerio.load(str)
        let lang = this.lang
        let $children = lang === 'cn' ? $('.layout.cn').children('ul').children() : $('.dict-basic-ul').children()
        let $length = lang === 'cn' ? $children.length : $children.length - 1
        let result = []

        if ($length) {
            for (let i = 0; i < $length; i++) {
                let child = $children[i]

                if (lang === 'cn') {
                    result.push({
                        translation: '- ' + $(child).children('a').text().replace(/\t/g, '').replace(/\n/g, '')
                    })
                } else {
                    if ($(child).children('span').length) {
                        result.push({
                            type: $(child).children('span').text(),
                            translation: $(child).children('strong').text().replace(/\t/g, '')
                        })
                    } else {
                        result.push({
                            alias: $(child).children('strong').text()
                        })
                    }
                }
            }
        }

        this.$data = result
    }

    /**
     * print result in cmd line
     */
    public output () {
        let result = this.$data

        if (result.length) {
            for (let _arr of this.$data) {
                if (_arr.type) {
                    console.log(`${_arr.type} ${_arr.translation}`)
                } else {
                    console.log(`${_arr.alias || _arr.translation}`)
                }
            }
        } else {
            if (this.lang === 'cn') {
                console.log('暂无匹配翻译')
            } else {
                console.log(`No appropriate translation`)
            }
        }
    }

    /**
     * detect language when no parameter input from cmd line
     */
    public detectLang (str: string) {
        let lang = ''
        let code = str.charCodeAt(0)

        if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
            lang = 'en'
        } else {
            lang = 'cn'
        }

        return lang
    }
}

/**
 * main execution function
 */
async function exec () {
    let request = new AsyncRequest()
    let $data = new Data(_)
    let response = await request.get(`${_}`)

    $data.analyse(response)

    setTimeout(() => {
        spinner.stop()
        $data.output()
    }, 200)
}

exec()