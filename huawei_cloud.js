// ==UserScript==
// @name         HUAWEI Cloud Education Download
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  下载华为云学院视频样题PDF
// @author       MasterZR
// @match        https://education.huaweicloud.com/courses/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=huaweicloud.com
// @grant GM_addStyle
// @grant GM_log
// @grant GM_download
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_listValues
// @require file:///C:/Users/MasterZR/Videos/huawei/huawei_cloud.js
// @require https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js
// ==/UserScript==


(function () {
    'use strict';


    console.log("MasterZR!");
    _addJs()
    // 获取当前页面的分类：
    // videojs 视频
    // pdf 课件
    // problem 样题

    /**
     * 添加JS库
     * 1.JSPDF
     * 2.FORGEJS
     */
    async function _addJs() {
        let forgeJs = document.createElement('script');
        forgeJs.setAttribute('type', 'text/javascript');
        forgeJs.setAttribute('id', 'forgeJs');
        forgeJs.src = "https://unpkg.com/node-forge@1.0.0/dist/forge.min.js";
        document.documentElement.appendChild(forgeJs);

        let jsPdfScript = document.createElement('script');
        jsPdfScript.setAttribute('type', 'text/javascript');
        jsPdfScript.setAttribute('id', 'jsPDF');
        jsPdfScript.src = "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js";
        document.documentElement.appendChild(jsPdfScript);
    }
    /**
    * 获取当前页面的类型
    * 1.videojs 视频
    * 2.pdf 课件
    * 3.problem 样题
    */
    function _get_typeKey() {
        var typeKey = ''
        if (document.getElementsByClassName("pdfDocumentCon").length) {
            typeKey = 'pdf'
        } else if (document.getElementsByClassName("vert vert-0")[0].firstElementChild.dataset.blockType) {
            typeKey = document.getElementsByClassName("vert vert-0")[0].firstElementChild.dataset.blockType
        } else {
            typeKey = 'problem'
        }
        console.log(typeKey)
        return typeKey
    }
    /**
    * 生成文件名
    * 章名+节名+后缀
    * @description 1.videojs 视频 MP4
    * @description 2.pdf 课件 PDF
    * @description 3.problem 样题 TXT
    */
    function _get_fileName() {
        // 生成文件名
        var Title = document.getElementsByClassName("active").tab_0.dataset.path.split(">");
        var mainTitle = Title[0].replace(/\s*/g, "").split(" ");
        var subTitle = Title[1].replace(/(^\s*)|(\s*$)/g, "").split(" ");
        var subTitle2 = Title[2].replace(/\s*/g, "").split(" ");
        var fileType = _get_typeKey()
        var fileName = ""
        switch (fileType) {
            case 'videojs':
                fileName = subTitle[0] + "_" + mainTitle + "_" + subTitle[0] + subTitle[1] + "-" + subTitle2;
                return fileName + ".mp4"
            case 'pdf':
                fileName = subTitle[0] + "_" + mainTitle + "_" + subTitle[0] + subTitle[1] + "-" + subTitle2;
                return fileName + ".pdf"
            case 'problem':
                fileName = subTitle[0] + "_" + mainTitle + "_" + subTitle[0] + subTitle[1] + "-" + subTitle2;
                return fileName + ".txt"
            default:
                break;
        }
        // console.log(fileName)
    }


    /**
    * observe回调函数
    * @function 水印出现后移除
    */
    function _removeWaterMarkes(list) {
        for (const key in list) {
            if (Object.hasOwnProperty.call(list, key)) {
                const element = list[key];
                if (element.attributeName == 'class' && element.target.children[0].classList[0] == 'watermark-elem') {
                    console.log(element)
                    for (let i = 0; i < document.getElementsByClassName("watermark-elem").length; i++) {
                        document.getElementsByClassName("watermark-elem")[i].setAttribute("style", "display:none")
                    }
                }
            }
        }
    }


    /**
    * observe 
    * @function 添加监听器
    */
    function _OBS() {
        var waterMarks = new MutationObserver(_removeWaterMarkes)
        var waterMarksNodes = $('.HU-video')[0]
        var options = {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
            attributeOldValue: true
        };
        waterMarks.observe(waterMarksNodes, options)
    }
    async function _get_video(isDown) {
        console.log(isDown)
        console.log("getVideo")
        // 获取隐藏html标签
        // 隐藏html标签中获取video_id
        var hiddenHtml = {}
        hiddenHtml.htmlStr = document.getElementById("seq_contents_0").outerHTML
        hiddenHtml.ral = hiddenHtml.htmlStr.replaceAll("&lt;", "<")
        hiddenHtml.html = hiddenHtml.ral.replaceAll("&gt;", ">")
        var hiddenHtmlNode = new DOMParser().parseFromString(hiddenHtml.html, 'text/html')
        document.body.appendChild(hiddenHtmlNode.body.childNodes[0])
        var videoIdJson = JSON.parse(document.getElementsByClassName("xblock xblock-student_view xblock-student_view-videojs")[1].children[0].innerHTML)
        // 生成主机链接
        // 
        var targetObj = {}
        targetObj.hwHost = {}
        targetObj.hwHost.element = []
        // 当前使用的协议(http/https)
        targetObj.hwHost.protocol = document.location.protocol
        // 主机域名
        targetObj.hwHost.host = window.location.host
        // 两个常用的path
        targetObj.hwHost.paths = ["vod/videos/", "play_video/"]
        // host vod/videos/video_id
        // 返回JSON格式m3u8列表
        // https://education.huaweicloud.com/vod/videos/b15991a3-b2ed-460b-a366-f4d9dd02f4e0/
        // host asset_id/play_video/video_id_清晰度_序列_后缀
        // https://13.cdn-vod.huaweicloud.com/asset/0ac34ca6dc9cbde9acda6d090c876ff7/play_video/84595d7ceed9c397068cfb0730749116_2_7.ts
        targetObj.hwHost.m3u8Host = `${targetObj.hwHost.protocol}//`
        // 获取视频ID
        targetObj.hwHost.videoIdHost = `${targetObj.hwHost.protocol}//${targetObj.hwHost.host}/${targetObj.hwHost.paths[0]}${videoIdJson.video_id}/`
        var videoIdJsonRes = await fetch(targetObj.hwHost.videoIdHost).then(function (res) { return res.json() })
        // 合并json
        targetObj.videoIdRes = Object.assign(videoIdJsonRes, videoIdJson);
        targetObj.elements = []
        // 获取视频清晰度json
        targetObj.qualityJson = videoIdJsonRes.video_quality[videoIdJsonRes.video_quality.length - 1]
        // 拆分m3u8url
        var temp = targetObj.qualityJson.video_url.split("//")
        targetObj.elements = temp.concat(temp[1].split("/"))
        // 获取ts主机链接
        for (let index = 2; index < targetObj.elements.length - 1; index++) {
            // console.log(targetObj.elements[index])
            targetObj.hwHost.m3u8Host += targetObj.elements[index] + '/'
        }
        // 获取m3u8文件
        var tsList = await fetch(targetObj.qualityJson.video_url).then(function (res) { return res.text() })
        var fullTsList = []
        // 从m3u8文件生成数组
        var tempList = tsList.split("\n")
        // 删除最后一行的空行
        var m3u8TextList = tempList.slice(0, tempList.length - 1)
        // tsUriList:完整TS文件链接
        var tsUriList = []
        var t = ''
        var keyStr = ''
        var m3u8Obj = {}
        for (let i = 0; i < m3u8TextList.length; i++) {
            // 没有#就给爷爬
            if (!Boolean(m3u8TextList[i].indexOf("#") + 1)) {
                // console.log(m3u8TextList[i])
                t = targetObj.hwHost.m3u8Host + m3u8TextList[i]
                tsUriList.push(t)
                fullTsList.push(t)
            }
            else {
                t = m3u8TextList[i]
                fullTsList.push(t)
                if (t.search(/URI/) > 0) {
                    m3u8Obj = await getM3u8KeyIv(t)
                }

            }
            var tsText = fullTsList.join("\n")
        }

        // for (const key in fullTsList) {
        //     if (Object.hasOwnProperty.call(fullTsList, key)) {
        //         const elements = fullTsList[key];
        //         if (!Boolean(elements.indexOf("#") + 1)) {
        //             tsUriList.push(elements)
        //         }
        //     }
        // }
        // 获取文件名
        var fileName = _get_fileName()
        // var isDownload = confirmAct("确定要下载吗")
        // var GMList = GM_listValues()
        // console.log(GMList)
        var isDownload = GM_getValue('isDownload', 'false')
        console.log(isDownload)
        if (isDownload || isDown) {
            _downloadVideo(fileName, tsUriList, m3u8Obj.key, m3u8Obj.iv)
        }
    }

    async function getM3u8KeyIv(m3u8Url) {
        var t = m3u8Url
        var m3u8Obj = {}
        if (t.search(/URI/) > 0) {
            m3u8Obj.keyUrl = t.substring(t.search(/URI/), t.search(/IV/)).split("\"")[1]
            m3u8Obj.iv = t.substring(t.search(/0x/) + 2, t.length).split("\"")[0]
            var key = await fetch(m3u8Obj.keyUrl).then(res => {
                return res.arrayBuffer()
            })
            m3u8Obj.key = [...new Uint8Array(key)]
                .map(x => x.toString(16).padStart(2, '0'))
                .join('');
            return m3u8Obj
        }

    }


    function hexToBytes(hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }
    /**
     * AES解密数据
     * @param encryptedData 加密后的数据
     * @param bytesKey AESkey(bytes)
     * @param bytesiv AESIV(bytes)
     * @returns 解密的数据
     */
    function decryption(encryptedData, bytesKey, bytesIv) {
        var decipher = forge.cipher.createDecipher('AES-CBC', bytesKey);
        decipher.start({ iv: bytesIv });
        decipher.update(forge.util.createBuffer(encryptedData));
        var result = decipher.finish(); // check 'result' for true/false
        // outputs decrypted hex
        // console.log(decipher.output);
        return decipher
    }
    /**
    * 获取TS文件的arraybuffer
    * @param url (ts文件完整链接)
    * @returns arraybuffer ts文件的arraybuffer
    */
    function getTs(url, key = '', iv = '') {
        return new Promise(async function (resolve, reject) {

            let data = {
                method: "GET",
                url: url,
                responseType: 'arraybuffer'
            }
            var dataObj = {}
            dataObj.headers = {}
            dataObj.data = []
            var bufferData = []
            var uint8ArrayData = []
            var decryptedData = {}
            if (key && iv) {
                var bytesKey = forge.util.hexToBytes(key)
                var bytesIv = forge.util.hexToBytes(iv)
                data = await fetch(url)
                console.log(data)
                dataObj.headers["content-type"] = data.headers.get("Content-Type")
                bufferData = await data.arrayBuffer()
                uint8ArrayData = new Uint8Array(bufferData)
                decryptedData = await decryption(uint8ArrayData, bytesKey, bytesIv)
                var blobData = new Blob([new Uint8Array(hexToBytes(decryptedData.output.toHex()))], { type: "video/mp2t" })
                dataObj.data = await blobData.arrayBuffer()
                resolve(dataObj)
            } else {
                resolve(axios(data));
            }
        })
    }
    /**
     * 合并arraybuffer
     * @param list (arraybuffer)合集
     * @returns arraybuffer ts文件合并后的arraybuffer
     */
    function mergeArrayBuffer(arrays) {
        let totalLen = 0;
        for (let arr of arrays) {
            totalLen += arr.byteLength;
        }
        let res = new Uint8Array(totalLen)
        let offset = 0
        for (let earr of arrays) {
            for (let arr of [earr]) {
                let uint8Arr = new Uint8Array(arr)
                res.set(uint8Arr, offset)
                offset += arr.byteLength
            }
        }
        return res.buffer
    }

    async function downloadPdf(iframeBlock) {
        var isAdd = await addJsPdf()
        if (isAdd) {
            var imgsize = [iframeBlock.img[0].naturalHeight,
            iframeBlock.img[0].naturalWidth]
            var PL = ""
            if (iframeBlock.img[0].naturalHeight > iframeBlock.img[0].naturalWidth) {
                PL = "p"
            } else {
                PL = "l"
            }
            var options = {
                orientation: PL,
                unit: 'px',
                format: imgsize,
                putOnlyUsedFonts: true,
                floatPrecision: "smart",// or "smart", default is 16,
                hotfixes: ["px_scaling"]
            }
            var { jsPDF } = window.jspdf
            var doc = new jsPDF(options)
            var blobArray = Object.keys(iframeBlock.blobUrlList)
            var temp = ''
            blobArray[1].slice(blobArray[0].search(/_/) + 1)
            for (var i = 0; i < blobArray.length - 1; i++) {//确定轮数
                for (var j = 0; j < blobArray.length - i - 1; j++) {//确定每次比较的次数
                    if (parseInt(blobArray[j].slice(blobArray[j].search(/_/) + 1)) > parseInt(blobArray[j + 1].slice(blobArray[j + 1].search(/_/) + 1))) {
                        console.log(blobArray[j + 1])
                        temp = blobArray[j]
                        blobArray[j] = blobArray[j + 1]
                        blobArray[j + 1] = temp
                    }
                }
            }
            console.log(blobArray)
            for (let index = 0; index < blobArray.length; index++) {
                const element = iframeBlock.blobUrlList[blobArray[index]];
                doc.addImage(element, 0, 0)
                if (index + 1 < blobArray.length) {
                    doc.addPage(imgsize, PL)
                } else {
                    doc.save(_get_fileName())
                }
            }
        }
    }

    function createBlobUrl(iframeBlock) {
        iframeBlock.blobUrlList = {}
        var blobName = Object.keys(iframeBlock.blobList)
        for (let index = 0; index < blobName.length; index++) {
            const element = iframeBlock.blobList[blobName[index]];
            iframeBlock.blobUrlList[blobName[index]] = URL.createObjectURL(element)
        }
        return iframeBlock
    }

    function _getPdfBlob(iframeBlock) {
        return new Promise((resolve, reject) => {
            var fullUrl = ''
            var imgName = Object.keys(iframeBlock.imgUrl)

            iframeBlock.blobList = {}
            for (let index = 0; index < imgName.length; index++) {
                const element = iframeBlock.imgUrl[imgName[index]];
                fullUrl = `${element}&time=${Date.now()}`
                fetch(fullUrl).then(res => {
                    return res.blob()
                }).then(res => {
                    iframeBlock.blobList[imgName[index]] = res
                    if (Object.keys(iframeBlock.blobList).length == imgName.length) {

                        resolve(iframeBlock)
                    }
                })
            }
        })
    }

    function promisifyCheckImgUrl(time, iframeBlock) {
        return new Promise(resolve => {
            console.log("CheckImgUrl")
            console.log(iframeBlock)
            var i = 0;
            var searchImagesP = 0
            var searchImagesP2 = 0
            var objAttribute = ''
            var intvl = setInterval(() => {
                var urlNum = 0
                for (let i = 0; i < iframeBlock.img.length; i++) {
                    const element = iframeBlock.img[i];
                    if (element.src != '') {
                        urlNum++
                    }
                }
                console.log(`已加载的URL数量：${urlNum}`)
                console.log(`总URL数量${iframeBlock.img.length}`)
                if (urlNum == iframeBlock.img.length) {
                    iframeBlock.img.forEach(element => {
                        searchImagesP = element.src.search(/images/)
                        searchImagesP2 = element.src.search(/.jpg/)
                        objAttribute = element.src.slice(searchImagesP, searchImagesP2)
                        iframeBlock.imgUrl[objAttribute] = element.src
                    });
                    resolve(iframeBlock);
                    clearInterval(intvl);
                }
            }, time);
        })
    }

    function promisifyScrollNodes(time, iframeBlock) {
        return new Promise(resolve => {
            console.log("Interval")
            var i = 0;
            var intvl = setInterval(() => {
                iframeBlock.doc.getElementById("outerContainer").scrollTop = (iframeBlock.elementHeigh) * (i + 1)
                var scrollHeight = (iframeBlock.elementHeigh) * (i + 1)
                console.log(scrollHeight, iframeBlock.blockHeight)
                if (i > iframeBlock.pageNum || scrollHeight > iframeBlock.blockHeight) {
                    resolve(iframeBlock);
                    $downloadNum.innerHTML = `已捕获 ${iframeBlock.pageNum} 个文件`
                    console.log(iframeBlock)
                    clearInterval(intvl);
                    return
                }
                $downloadNum.innerHTML = `已捕获 ${i} 个文件`
                i++;
            }, time);
        })
    }

    function searchIframe() {
        var iframeBlock = {}
        iframeBlock.doc = {}
        iframeBlock.imgUrl = {}
        iframeBlock.img = []
        iframeBlock.scrollHeight = 0
        iframeBlock.blockHeight = 0
        iframeBlock.pageNum = 0
        iframeBlock.elementHeigh = 0
        iframeBlock.pageNum = document.getElementById("pdfiFrame").src.slice(document.getElementById("pdfiFrame").src.search(/page/i) + 5)
        iframeBlock.doc = document.getElementsByTagName("iframe")[0].contentDocument
        iframeBlock.blockHeight = iframeBlock.doc.getElementById("c").clientHeight
        var pN = ''
        for (let j = 0; j < iframeBlock.pageNum; j++) {
            pN = `p${j + 1}`
            let img = iframeBlock.doc.getElementById(pN)
            iframeBlock.img.push(img)
        }
        iframeBlock.elementHeigh = iframeBlock.doc.getElementById("p1").height + 50
        iframeBlock.doc = document.getElementsByTagName("iframe")[0].contentDocument
        iframeBlock.scrollHeight = 0
        return iframeBlock
    }

    function _get_pdf() {
        var iframeBlock = {}
        var targetNodes = {}
        targetNodes.iframe = $('#pdfiFrame')[0].contentDocument;//content监听的元素id
        var iframeMutationObserver = new MutationObserver(iframeCallback);
        console.log(targetNodes)
        //options：监听的属性
        var options = {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeOldValue: true
        };
        iframeMutationObserver.observe(targetNodes.iframe, options);

        function isSrc(mutationsList) {
            var mutationsList = mutationsList
            for (const i in mutationsList) {
                if (Object.hasOwnProperty.call(mutationsList, i)) {
                    const element = mutationsList[i];
                    if (element.attributeName == 'src') {
                        return true
                    } else {
                        return false
                    }
                }
            }
        }
        var isComplete = false

        function iframeCallback(mutationsList) {
            GM_setValue('isDownload', false)
            _spanStatus()
            // console.log(mutationsList)
            if (mutationsList.length < 100) {
                isComplete = isSrc(mutationsList)
                if (isComplete) {
                    if (mutationsList[0].attributeName == 'src') {

                        // get_pdfStart()
                        iframeMutationObserver.disconnect()
                    }
                }
            }
        }
        return iframeBlock
    }

    function get_pdfStart() {
        var iframeBlock = searchIframe()
        console.log(iframeBlock)
        promisifyScrollNodes(50, iframeBlock)
            .then(obj => {
                console.log(obj)
                console.log('滚动完成', obj)
                return (promisifyCheckImgUrl(10, obj))
            })
            .then(obj => {
                iframeBlock = obj
                console.log(obj)
                var blobList = _getPdfBlob(iframeBlock)
                blobList.then(res => {
                    console.log(res)
                    iframeBlock = createBlobUrl(res)
                    downloadPdf(iframeBlock)
                })
            })

    }

    function addJsPdf() {
        return new Promise((resolve, reject) => {
            let jsPdfScript = document.createElement('script');
            jsPdfScript.setAttribute('type', 'text/javascript');
            jsPdfScript.setAttribute('id', 'jsPDF');
            jsPdfScript.src = "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js";
            document.documentElement.appendChild(jsPdfScript);
            var timer = setInterval(() => {
                if (window.jspdf) {
                    console.log("clearInterval")
                    clearInterval(timer)
                    resolve(true)
                } else {
                    console.log("Loading")
                }
            }, 50);
        })
    }

    function _get_problem() {
        console.log("problem")
        var fileName = _get_fileName()
        var item = document.getElementsByClassName("problem")[0].innerText
        var itemBlob = new Blob([item], { type: "text/plain;charset=UTF-8" })
        const a = document.createElement('a');
        a.href = URL.createObjectURL(itemBlob)
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(a.href)
    }

    function main() {
        
        var fileType = _get_typeKey()
        console.log(fileType)
        switch (fileType) {
            case 'videojs':
                _get_video()
                _OBS()
                break;
            case 'pdf':
                _get_pdf()
                break;
            case 'problem':
                _get_problem()
                break;
            default:
                break;
        }
        _appendDom()
        _get_typeKey()
    }
    //操作按钮
    var $autoDownload = document.createElement('div')
    // 自动下载状态
    var $downloadStatus = document.createElement('span')
    var $downloadNum = document.createElement('div')
    var $btnDownload = document.createElement('div')
    var $hiddenBtn = document.createElement('div') // 隐藏按钮
    var GMGVisHidden = GM_getValue("ishidden", "false")
    $downloadNum.setAttribute("ishidden", GMGVisHidden)
    $btnDownload.setAttribute("ishidden", GMGVisHidden)
    $autoDownload.setAttribute("ishidden", GMGVisHidden)
    $downloadNum.setAttribute("id", "downloadNum")
    $btnDownload.setAttribute("id", "btnDownload")
    $autoDownload.setAttribute("id", "autoDownload")
    $hiddenBtn.setAttribute("id", "hiddenBtn")
    var isDownload = GM_getValue('isDownload', 'false')
    var baseStyle = `
          position: fixed;
          top: 50px;
          right: 50px;
          height: 40px;
          padding: 0 20px;
          z-index: 9999;
          color: white;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          line-height: 40px;
          text-align: center;
          border-radius: 4px;
          background-color: #3498db;
          box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.3);
          display:block;
        `
    // 隐藏按钮
    function _hiddenBtnFun() {
        var tempList = document.getElementsByTagName('html')[0].getElementsByTagName("div")
        var elements = []

        for (const i in tempList) {
            if (Object.hasOwnProperty.call(tempList, i)) {
                const element = tempList[i];
                if (!(element.id == "MathJax_Message")) {
                    elements.push(element)
                } else { break }
            }
        }
        if (tempList[0].getAttribute('ishidden') == 'false') {
            for (let i = 0; i < elements.length - 1; i++) {
                const element = elements[i];
                element.setAttribute("ishidden", "true")
                element.setAttribute("ishidden", "true")
                element.setAttribute("ishidden", "true")
                GM_setValue("ishidden", "true")
            }
            for (let index = 0; index < elements.length - 1; index++) {
                const e = elements[index];
                e.style.display = "none"
            }
            elements[elements.length - 1].style.top = "50px"
            elements[elements.length - 1].style.color = "white"
            elements[elements.length - 1].innerHTML = '显示'
        } else {
            for (let i = 0; i < elements.length - 1; i++) {
                const element = elements[i];
                element.setAttribute("ishidden", "false")
                element.setAttribute("ishidden", "false")
                element.setAttribute("ishidden", "false")
                GM_setValue("ishidden", "false")
            }
            for (let index = 0; index < elements.length - 1; index++) {
                const e = elements[index];
                e.style.display = "block"
            }
            elements[elements.length - 1].style.top = "200px"
            elements[elements.length - 1].style.color = "white"
            elements[elements.length - 1].innerHTML = '隐藏'
        }
    }

    // 添加操作的 dom
    function _appendDom() {
        $autoDownload.innerHTML = '自动下载状态：'
        $downloadStatus.innerHTML = ''
        $downloadNum.innerHTML = '已捕获 0 个文件'
        $btnDownload.innerHTML = '下载文件'
        $hiddenBtn.innerHTML = '隐藏'
        $autoDownload.style = baseStyle + `top:50px`
        $downloadNum.style = baseStyle + `top:100px`
        $btnDownload.style = baseStyle + `top: 150px;`
        $hiddenBtn.style = baseStyle + `top: 200px;`
        var ishidden = GM_getValue("ishidden", "false")
        if (ishidden == 'true') {
            $autoDownload.style.display = "none"
            $downloadNum.style.display = "none"
            $btnDownload.style.display = "none"
            $hiddenBtn.style.top = "50px"
            $hiddenBtn.style.color = "white"
            $hiddenBtn.innerHTML = '显示'

        }
        $autoDownload.addEventListener('click', _changeIsDownload)
        console.log(isDownload)
        var typeKey = ''
        if (document.getElementsByClassName("pdfDocumentCon").length) {
            typeKey = 'pdf'
        } else if (document.getElementsByClassName("vert vert-0")[0].firstElementChild.dataset.blockType) {
            typeKey = document.getElementsByClassName("vert vert-0")[0].firstElementChild.dataset.blockType
        } else {
            typeKey = 'problem'
        }
        console.log(typeKey)
        switch (typeKey) {
            case 'videojs':
                $btnDownload.addEventListener('click', function () {
                    _get_video(true)
                }
                )
                break;
            case 'pdf':
                $btnDownload.addEventListener('click', _downloadPdf)
                break;
            case 'problem':
                $btnDownload.addEventListener('click', _downloadText)
                break;
            default:
                break;
        }
        $hiddenBtn.addEventListener('click', _hiddenBtnFun)

        document.getElementsByTagName('html')[0].insertBefore($autoDownload, document.getElementsByTagName('head')[0]);
        if (!document.getElementsByTagName('html')[0].getElementsByTagName("div")[0].getElementsByTagName("span")[0]) {
            _spanStatus()
            document.getElementsByTagName('html')[0].getElementsByTagName("div")[0].appendChild($downloadStatus)
        }
        document.getElementsByTagName('html')[0].insertBefore($downloadNum, document.getElementsByTagName('head')[0]);
        document.getElementsByTagName('html')[0].insertBefore($btnDownload, document.getElementsByTagName('head')[0]);
        document.getElementsByTagName('html')[0].insertBefore($hiddenBtn, document.getElementsByTagName('head')[0]);
        _spanStatus()
        //回调事件
        function callback(mutationsList, observer) {
            var btn1 = $('#autoDownload')[0]
            var btn2 = $('#downloadNum')[0]
            var btn3 = $('#btnDownload')[0]

            if (btn1.clientWidth > btn2.clientWidth && btn1.clientWidth > btn3.clientWidth) {
                btn1.style.top = "50px"
                if (btn2.clientWidth > btn3.clientWidth) {
                    btn2.style.top = "100px"
                    btn3.style.top = "150px"

                } else {
                    btn3.style.top = "100px"
                    btn2.style.top = "150px"
                }
            } else if (btn2.clientWidth > btn1.clientWidth && btn2.clientWidth > btn3.clientWidth) {
                btn2.style.top = "50px"
                if (btn1.clientWidth > btn3.clientWidth) {
                    btn1.style.top = "100px"
                    btn3.style.top = "150px"

                } else {
                    btn3.style.top = "100px"
                    btn1.style.top = "150px"
                }
            } else if (btn3.clientWidth > btn1.clientWidth && btn3.clientWidth > btn2.clientWidth) {
                btn3.style.top = "50px"
                if (btn2.clientWidth > btn1.clientWidth) {
                    btn2.style.top = "100px"
                    btn1.style.top = "150px"

                } else {
                    btn1.style.top = "100px"
                    btn2.style.top = "150px"
                }
            }

            console.log($('#autoDownload')[0].clientWidth)
            console.log($('#downloadNum')[0].clientWidth)
            console.log($('#btnDownload')[0].clientWidth)

        }
        var targetNodes = {}
        targetNodes.hiddenBtn = $('#hiddenBtn')[0];//content监听的元素id
        targetNodes.downloadNum = $('#downloadNum')[0];//content监听的元素id
        var mutationObserver = new MutationObserver(callback);
        console.log(targetNodes)
        //options：监听的属性
        var options = {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
            attributeOldValue: true
        };
        mutationObserver.observe(targetNodes.downloadNum, options);
        mutationObserver.observe(targetNodes.hiddenBtn, options)
        //回调事件
    }

    /**
     * 下载视频
     * @param fileName 文件名
     * @param tsUriList ts完整URI
     */

    async function _downloadVideo(fileName, tsUriList, m3u8Key, m3u8Iv) {
        var buffers = {}
        // buffer.mime:文件类型
        buffers.mime = ""
        // buffers.buffer:arraybuffer合集
        buffers.buffers = []
        for (const key in tsUriList) {
            if (Object.hasOwnProperty.call(tsUriList, key)) {
                const element = tsUriList[key];
                // 获取对应TS文件的arraybuffer
                var arrayBuffers = await getTs(element, m3u8Key, m3u8Iv)
                buffers.buffers.push(arrayBuffers.data)
                console.log(buffers)
                $downloadNum.innerHTML = `已捕获 ${buffers.buffers.length} 个文件`
                buffers.mime = arrayBuffers.headers["content-type"]
            }
        }
        // buffers.ALLbuffers:所有TS合并之后的文件
        buffers.ALLbuffers = mergeArrayBuffer(buffers.buffers)
        var blobFile = new Blob([buffers.ALLbuffers], { type: buffers.mime });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blobFile)
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
    }
    function _downloadPdf() {
        console.log("downloadPdf")
        get_pdfStart()
    }
    function _downloadText() {
        console.log("downloadText")
        _get_problem()
    }

    // 修改是否可以下载
    function _changeIsDownload() {
        console.log("isDownload")
        console.log(GM_getValue('isDownload', ''))
        var fileName = _get_fileName()
        if (fileName.search(/pdf/) == -1) {
            isDownload = !isDownload
            console.log(isDownload)
            GM_setValue('isDownload', isDownload)
            console.log(isDownload)
            _spanStatus()
        } else {
            alert("PDF 无法后台加载，自动下载开启失败")
            GM_setValue('isDownload', false)
            _spanStatus()
        }

    }
    //修改开/关
    function _spanStatus() {
        const statusOffStyle = `
        color:red
        `
        const statusOnStyle = `
        color:yellow
        `
        console.log("spanStatus")
        isDownload = GM_getValue('isDownload', false)
        if (isDownload) {
            $downloadStatus.style = statusOnStyle
            $downloadStatus.innerHTML = '开'
        } else {
            $downloadStatus.innerHTML = '关'
            $downloadStatus.style = statusOffStyle
        }
    }

    // Your code here...
    main()
})();

