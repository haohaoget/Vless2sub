//sub?host=test.workers.dev&uuid=uuid&client=cf
let mytoken= '';//快速订阅访问入口, 留空则不启动快速订阅
// 设置优选地址，不带端口号默认8443，不支持非TLS订阅生成
let addresses = [

];

// 设置优选地址api接口
let addressesapi = [

];

let DLS = 4;//速度下限
let addressescsv = [
	//'https://raw.githubusercontent.com/cmliu/WorkerVless2sub/main/addressescsv.csv' //iptest测速结果文件。
];

let subconverter = 'api.v1.mk';//在线订阅转换后端，目前使用肥羊的订阅转换功能。支持自建psub 可自行搭建https://github.com/bulianglin/psub
let subconfig = "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Full_MultiMode.ini"; //订阅配置文件

let link = '';
let edgetunnel = 'ed';
let RproxyIP = 'false';
let proxyIPs = [
	'ProxyIP.US.CMLiussss.net',
	'ProxyIP.KR.CMLiussss.net',
	'ProxyIP.Aliyun.CMLiussss.net',
	'ProxyIP.JP.CMLiussss.net',
	'my-telegram-is-herocore.onecf.eu.org',
];
let socks5s = [];

let BotToken ='';
let ChatID =''; 
let proxyhosts = [//本地代理域名池
	//'ppfv2tl9veojd-maillazy.pages.dev',
];
let proxyhostsURL = 'https://raw.githubusercontent.com/cmliu/CFcdnVmess2sub/main/proxyhosts';//在线代理域名池URL
let EndPS = '';//节点名备注内容

async function sendMessage(type, ip, add_data = "") {
	if ( BotToken !== '' && ChatID !== ''){
		let msg = "";
		const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
		if (response.status == 200) {
			const ipInfo = await response.json();
			msg = `${type}\nIP: ${ip}\n国家: ${ipInfo.country}\n<tg-spoiler>城市: ${ipInfo.city}\n组织: ${ipInfo.org}\nASN: ${ipInfo.as}\n${add_data}`;
		} else {
			msg = `${type}\nIP: ${ip}\n<tg-spoiler>${add_data}`;
		}
	
		let url = "https://api.telegram.org/bot"+ BotToken +"/sendMessage?chat_id=" + ChatID + "&parse_mode=HTML&text=" + encodeURIComponent(msg);
		return fetch(url, {
			method: 'get',
			headers: {
				'Accept': 'text/html,application/xhtml+xml,application/xml;',
				'Accept-Encoding': 'gzip, deflate, br',
				'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72'
			}
		});
	}
}

async function getAddressesapi() {
	if (!addressesapi || addressesapi.length === 0) {
		return [];
	}
	
	let newAddressesapi = [];
	
	for (let apiUrl of addressesapi) {
		try {
			
			const response = await fetch(apiUrl);
		
			if (!response.ok) {
				console.error('获取地址时出错:', response.status, response.statusText);
				continue;
			}
		
			const text = await response.text();
			const lines = text.split('\n');
			//const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(#.*)?$/;
			//IP 地址为必需部分，格式为 199.19.111.14
			//端口号和名称是可选部分：
			//端口号格式为 数字，并且以：或，开头
			//名称格式为 任意字，并且以#或，开头
			const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::|,)?(\d+)?(?:#|,)?([^,#]*)?$/;
			const apiAddresses = lines.map(line => {
				const match = line.match(regex);
				return match ? match[0] : null;
			}).filter(Boolean);
		
			newAddressesapi = newAddressesapi.concat(apiAddresses);
			
		} catch (error) {
			console.error('获取地址时出错:', error);
			continue;
		}
	}
	// 判断数组 newAddressesapi 的长度是否大于 40
	// if (newAddressesapi.length > 50) {
	// 	// 随机取其中的 40 个值
	// 	const randomItems = [];
	// 	while (randomItems.length < 50) {
	// 		const randomIndex = Math.floor(Math.random() * newAddressesapi.length);
	// 		if (!randomItems.includes(newAddressesapi[randomIndex])) {
	// 			randomItems.push(newAddressesapi[randomIndex]);
	// 		}
	// 	}

	// 	newAddressesapi = randomItems;
	// }
	return newAddressesapi;
}

async function getAddressescsv() {
	if (!addressescsv || addressescsv.length === 0) {
		return [];
	}
	
	let newAddressescsv = [];
	
	for (const csvUrl of addressescsv) {
		try {
			const response = await fetch(csvUrl);
		
			if (!response.ok) {
				console.error('获取CSV地址时出错:', response.status, response.statusText);
				continue;
			}
		
			const text = await response.text();// 使用正确的字符编码解析文本内容
			const lines = text.split('\n');
		
			// 检查CSV头部是否包含必需字段
			const header = lines[0].split(',');
			const tlsIndex = header.indexOf('TLS');
			const speedIndex = header.length - 1; // 最后一个字段
		
			const ipAddressIndex = 0;// IP地址在 CSV 头部的位置
			const portIndex = 1;// 端口在 CSV 头部的位置
			const dataCenterIndex = tlsIndex + 1; // 数据中心是 TLS 的后一个字段
		
			if (tlsIndex === -1) {
				console.error('CSV文件缺少必需的字段');
				continue;
			}
		
			// 从第二行开始遍历CSV行
			for (let i = 1; i < lines.length; i++) {
				const columns = lines[i].split(',');
		
				// 检查TLS是否为"TRUE"且速度大于DLS
				if (columns[tlsIndex].toUpperCase() === 'TRUE' && parseFloat(columns[speedIndex]) > DLS) {
					const ipAddress = columns[ipAddressIndex];
					const port = columns[portIndex];
					const dataCenter = columns[dataCenterIndex];
			
					const formattedAddress = `${ipAddress}:${port}#${dataCenter}`;
					newAddressescsv.push(formattedAddress);
				}
			}
		} catch (error) {
			console.error('获取CSV地址时出错:', error);
			continue;
		}
	}
	// 判断数组 newAddressesapi 的长度是否大于 40
	if (newAddressescsv.length > 40) {
		// 随机取其中的 40 个值
		const randomItems = [];
		while (randomItems.length < 40) {
			const randomIndex = Math.floor(Math.random() * newAddressescsv.length);
			if (!randomItems.includes(newAddressescsv[randomIndex])) {
				randomItems.push(newAddressescsv[randomIndex]);
			}
		}

		newAddressescsv = randomItems;
	}
	return newAddressescsv;
}

let protocol;
export default {
	async fetch (request, env) {
		mytoken = env.TOKEN || mytoken;
		BotToken = env.TGTOKEN || BotToken;
		ChatID = env.TGID || ChatID; 
		subconverter = env.SUBAPI || subconverter;
		subconfig = env.SUBCONFIG || subconfig;
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		const url = new URL(request.url);
		const format = url.searchParams.get('format') ? url.searchParams.get('format').toLowerCase() : "null";
		let host = "";
		let uuid = "";
		let path = "";

		addresses = env.ADDRESSES ? env.ADDRESSES.split(",") : addresses;
		addressesapi = env.ADDRESSESAPI ? env.ADDRESSESAPI.split(",") : addressesapi;
		addressescsv = env.ADDRESSESCSV ? env.ADDRESSESCSV.split(",") : addressescsv;
		subconverter = env.SUBCONVERTER || subconverter;
		let cfworkerhost = env.CFWORKERHOST || 'test.workers.dev';
		let cfpagehost = env.CFPAGEHOST || 'test.pages.dev';
		let bookhost = env.BOOKHOST || cfpagehost;
		const cfsocks5address = env.SUB_BUCKET ? await env.SUB_BUCKET.get('socks5') : null;
		socks5s = [];
		if (cfsocks5address && cfsocks5address.length > 0) {
			cfsocks5address.trim().split("\n").map(line => {
				//console.log(line);
				try {
				let obj = JSON.parse(line);
				socks5s.push(obj);
				//console.log(obj);
				} catch (error) {
				console.error("Error parsing JSON:", error);
				}
			});
		//console.log(cfsocks5address);
		} else {
			console.log(cfsocks5address);
		}
		//console.log(socks5s);

		if (mytoken !== '' && url.pathname.includes(mytoken)) {
			host = env.HOST || "edgetunnel-2z2.pages.dev";
			uuid = env.UUID || "30e9c5c8-ed28-4cd9-b008-dc67277f8b02";
			path = env.PATH || "/?ed=2560";
			edgetunnel = env.ED || edgetunnel;
			RproxyIP = env.RPROXYIP || RproxyIP;

			const hasSos = url.searchParams.has('sos');
			if (hasSos) {
				const hy2Url = "https://hy2sub.pages.dev";
				try {
					const subconverterResponse = await fetch(hy2Url);
	
					if (!subconverterResponse.ok) {
						throw new Error(`Error fetching lzUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
					}
	
					const base64Text = await subconverterResponse.text();
					link = atob(base64Text); // 进行 Base64 解码
	
				} catch (error) {
					// 错误处理
				}	
			}
		await sendMessage("#获取订阅", request.headers.get('CF-Connecting-IP'), `UA: ${userAgent}</tg-spoiler>\n域名: ${url.hostname}\n<tg-spoiler>入口: ${url.pathname + url.search}</tg-spoiler>`);
		} else {
			host = url.searchParams.get('host');
			uuid = url.searchParams.get('uuid');
			path = url.searchParams.get('path');
			
			if (!url.pathname.includes("/sub")) {
				const responseText = `
			路径必须包含 "/sub"
			The path must contain "/sub"
			مسیر باید شامل "/sub" باشد
			
			${url.origin}/sub?host=[your host]&uuid=[your uuid]&path=[your path]
			
			
			
			
			
			
				
				https://github.com/cmliu/WorkerVless2sub
				`;
			
				return new Response(responseText, {
				status: 400,
				headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
			
			if (!host || !uuid) {
				const responseText = `
			缺少必填参数：host 和 uuid
			Missing required parameters: host and uuid
			پارامترهای ضروری وارد نشده: هاست و یوآی‌دی
			
			${url.origin}/sub?host=[your host]&uuid=[your uuid]&path=[your path]
			
			
			
			
			
			
				
				https://github.com/cmliu/WorkerVless2sub
				`;
			
				return new Response(responseText, {
				status: 400,
				headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
			
			if (!path || path.trim() === '') {
				path = '/?ed=2560';
			} else {
				// 如果第一个字符不是斜杠，则在前面添加一个斜杠
				path = (path[0] === '/') ? path : '/' + path;
			}
		}
		
		//bestproxy节点生成
		if(url.searchParams.get('host') && (url.searchParams.get('host').includes(cfworkerhost))) {
			//优选域名
			let bestcfip = env.BESTCFIP || 'bestcf.org';
			let bestproxyip = env.BESTPROXYIP || 'bestproxy.org';
			//优选ip
			let cfip = env.CFIP || 'bestcf.org';
			let proxyip = env.PROXYIP || 'bestproxy.org';
			let ntlsports = ["80","8080","8880","2052","2086","2095","2082"];
			let tlsports = ["2096","2087","2083","443","8443","2053"];
			const vlessLinks = [];

			if(url.searchParams.get('client') && (url.searchParams.get('client').includes('ip'))){
				//cfip赋值给8443端口的https，proxyip赋值给80端口的http
				let cfAddressesapi = [];
				let proxyAddressesapi = [];
				//获取ip地址文本
				try {
					const cfresponse = await fetch(cfip);
					const proxyresponse = await fetch(proxyip);
				
					if (!cfresponse.ok) {
						console.error('获取地址时出错:', cfresponse.status, cfresponse.statusText);
						//continue;
					}
					if (!proxyresponse.ok) {
						console.error('获取地址时出错:', proxyresponse.status, proxyresponse.statusText);
						//continue;
					}
				
					const cftext = await cfresponse.text();
					const proxytext = await proxyresponse.text();
					const cflines = cftext.split('\n');
					const proxylines = proxytext.split('\n');
					//要求ip库为纯ip
					const regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
					const cfAddresses = cflines.map(line => {
						const match = line.match(regex);
						return match ? match[0] : null;
					}).filter(Boolean);
					const proxyAddresses = proxylines.map(line => {
						const match = line.match(regex);
						return match ? match[0] : null;
					}).filter(Boolean);
					cfAddressesapi = cfAddressesapi.concat(cfAddresses)
					proxyAddressesapi = proxyAddressesapi.concat(proxyAddresses)
					
				} catch (error) {
					console.error('获取地址时出错:', error);
					return new Response(`Error: ${error.message}`, {
						status: 500,
						headers: { 'content-type': 'text/plain; charset=utf-8' },
					})
				}
				//合成vless链接，要求ip库为纯ip未过滤
				for (let i = 0; i < proxyAddressesapi.length; i++) {
					const ip = proxyAddressesapi[i];
					const vlessLink = `vless://${uuid}@${ip}:80?encryption=none&flow=&security=none&fp=random&type=ws&host=${host}&path=/=2560#CFW-${ip}`;
					vlessLinks.push(vlessLink);
				}

				// 合成HTTPS的vless链接
				for (let i = 0; i < proxyAddressesapi.length; i++) {
					const ip = proxyAddressesapi[i];
					const vlessLink = `vless://${uuid}@${ip}:8443?encryption=none&security=tls&sni=${cfpagehost}&fp=random&type=ws&host=${cfpagehost}&path=/?ed=2560#CFWS-${ip}`;
					vlessLinks.push(vlessLink);
				}
				
				if (cfAddressesapi.length > 0) {
					const ip = cfAddressesapi[0];
					const vlessLink = `vless://${uuid}@${ip}:8443?encryption=none&security=tls&sni=${cfpagehost}&fp=random&type=ws&host=${cfpagehost}&path=/?ed=2560#CF-${ip}`;
					vlessLinks.push(vlessLink);
				}

			} else if(url.searchParams.get('client') && (url.searchParams.get('client').includes('cfct'))){
				//ipv4或ipv6域名识别
				const addressRegex = /^((?:\d{1,3}\.){3}\d{1,3}|\[([\da-f:]+)\]|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}):(\d+)#(.*)$/i;
				const cfctaddressapi = env.SUB_BUCKET ? await env.SUB_BUCKET.get('cfctaddressapi') : null;

				const cfctapi = cfctaddressapi.split('\n');
				cfctapi.map(line => {
					const match = line.match(addressRegex);
					if (match){
						const [, ipv4OrDomain, ipv6, port, name] = match;
						const ipOrDomain = ipv6 ? `[${ipv6}]` : ipv4OrDomain;
						const addressid = name;
						
						// let path = "/?ed=2560&proxyIP=ProxyIP.US.CMLiussss.net";
						let encryption = `${socks5s[2].encryption}`;
						let path = `/${socks5s[2].path}?ed=2560`;
						let hostbook = `${socks5s[2].socks5}`;
						if(socks5s.length > 0){
							
							// path = `/?ed=2560&socks5=${socks5s[0].socks5}`;
							for (let item of socks5s) {
								if (addressid.includes(item.type)) {
									hostbook = `${item.socks5}`;

									// path = `/?ed=2560&socks5=${item.socks5}`;
									break; // 找到匹配项，跳出循环
								}
							}
							//console.log(path);
						}
						
						// for (let item of CFCproxyIPs) {
						// 	if (addressid.includes(item.type)) {
						// 		path = `/proxyIP=${item.proxyIP}`;
						// 		break; // 找到匹配项，跳出循环
						// 	}
						// }
						path = encodeURIComponent(path);
						if (ntlsports.includes(port)){
							const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=none&flow=&security=none&fp=random&type=ws&host=${host}&path=/?=2560#${addressid}`;
							vlessLinks.push(vlessLink);
						}else{
							const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=${encryption}&security=tls&sni=${hostbook}&fp=chrome&type=ws&path=${path}#${addressid}`;
							vlessLinks.push(vlessLink);
						}
						console.log(`地址：${ipOrDomain}，端口：${port}，名称：${addressid}`);
					} else {
						console.log(`无效的地址：${line}`);
					}
				
				});

				
				
			}else if(url.searchParams.get('client') && (url.searchParams.get('client').includes('cf'))){
				//ipv4或ipv6域名识别
				const addressRegex = /^((?:\d{1,3}\.){3}\d{1,3}|\[([\da-f:]+)\]|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}):(\d+)#(.*)$/i;
				const cfaddressapi = env.SUB_BUCKET ? await env.SUB_BUCKET.get('cfaddressapi') : null;

				const cfapi = cfaddressapi.split('\n');
				cfapi.map(line => {
					const match = line.match(addressRegex);
					if (match){
						const [, ipv4OrDomain, ipv6, port, name] = match;
						const ipOrDomain = ipv6 ? `[${ipv6}]` : ipv4OrDomain;
						const addressid = name;

						// let path = "/?ed=2560&proxyIP=ProxyIP.US.CMLiussss.net";
						let encryption = `${socks5s[2].encryption}`;
						let path = `/${socks5s[2].path}?ed=2560`;
						let hostbook = `${socks5s[2].socks5}`
						if(socks5s.length > 0){

							// path = `/?ed=2560&socks5=${socks5s[0].socks5}`;
							for (let item of socks5s) {
								if (addressid.includes(item.type)) {
									hostbook = `${item.socks5}`;
									// path = `/?ed=2560&socks5=${item.socks5}`;
									break; // 找到匹配项，跳出循环
								}
							}
							//console.log(path);
						}
						
						
						// for (let item of CFCproxyIPs) {
						// 	if (addressid.includes(item.type)) {
						// 		path = `/proxyIP=${item.proxyIP}`;
						// 		break; // 找到匹配项，跳出循环
						// 	}
						// }
						path = encodeURIComponent(path);
						if (ntlsports.includes(port)){
							const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=none&flow=&security=none&fp=random&type=ws&host=${host}&path=/?=2560#${addressid}`;
							vlessLinks.push(vlessLink);
						}else{
							const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=${encryption}&security=tls&sni=${hostbook}&fp=chrome&type=ws&path=${path}#${addressid}`;
							vlessLinks.push(vlessLink);
						}
						console.log(`地址：${ipOrDomain}，端口：${port}，名称：${addressid}`);
					} else {
						console.log(`无效的地址：${line}`);
					}
				
				});

				
				// const cf_api = env.SUB_BUCKET ? await env.SUB_BUCKET.get('cf_api') : null;
				
				// const api = cf_api.split('\n');
				// api.map(line => {
				// 	const match = line.match(addressRegex);
				// 	if (match){
				// 		let path = "/?ed=2560&proxyIP=ProxyIP.US.CMLiussss.net";
				// 		const [, ipv4OrDomain, ipv6, port, name] = match;
				// 		const ipOrDomain = ipv6 ? `[${ipv6}]` : ipv4OrDomain;
				// 		const addressid = name;
				// 		if(socks5s.length > 0){
				// 			for (let item of socks5s) {
				// 				if (addressid.includes(item.type)) {
				// 					path = `/?ed=2560&socks5=${item.socks5}`;
				// 					break; // 找到匹配项，跳出循环
				// 				}
				// 			}
				// 			//console.log(path);
				// 		}
				// 		path = encodeURIComponent(path);
				// 		if (ntlsports.includes(port)){
				// 			const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=none&flow=&security=none&fp=random&type=ws&host=${host}&path=${path}#${addressid}`;
				// 			vlessLinks.push(vlessLink);
				// 		}else{
				// 			const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=none&security=tls&sni=${bookhost}&fp=random&type=ws&host=${bookhost}&path=${path}#${addressid}`;
				// 			vlessLinks.push(vlessLink);
				// 		}
				// 		console.log(`地址：${ipOrDomain}，端口：${port}，名称：${addressid}`);
				// 	} else {
				// 		console.log(`无效的地址：${line}`);
				// 	}
				
				// });
				
			}else if(url.searchParams.get('client') && (url.searchParams.get('client').includes('cloudfront'))){
				const cfhostt = env.CFHOSTT || cfpagehost;
				///ipv4或ipv6域名识别
				const addressRegex = /^((?:\d{1,3}\.){3}\d{1,3}|\[([\da-f:]+)\]|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}):(\d+)#(.*)$/i;

				const cftaddressapi = env.SUB_BUCKET ? await env.SUB_BUCKET.get('cftaddressapi') : null;
				// const cfsocks5address = env.SUB_BUCKET ? await env.SUB_BUCKET.get('socks5') : null;
				// console.log(`socks5的地址：${cfsocks5address}`);
				
				const cftapi = cftaddressapi.split('\n');
				cftapi.map(line => {
					const match = line.match(addressRegex);
					if (match){
						let encryption = `${socks5s[2].encryption}`;
						let path = `/${socks5s[2].path}?ed=2560`;
						const [, ipv4OrDomain, ipv6, port, name] = match;
						const ipOrDomain = ipv6 ? `[${ipv6}]` : ipv4OrDomain;
						const addressid = name;
						// if(socks5s.length > 0){
						// 	for (let item of socks5s) {
						// 		if (addressid.includes(item.type)) {
						// 			path = `/?ed=2560&socks5=${item.socks5}`;
						// 			break; // 找到匹配项，跳出循环
						// 		}
						// 	}
						// 	//console.log(path);
						// }
						path = encodeURIComponent(path);
						const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=${encryption}&security=tls&sni=${cfhostt}&fp=chrome&type=ws&path=${path}#${addressid}`;
						vlessLinks.push(vlessLink);
						
						console.log(`地址：${ipOrDomain}，端口：${port}，名称：${addressid}`);
					} else {
						console.log(`无效的地址：${line}`);
					}
				
				});
				
				// const cft_api = env.SUB_BUCKET ? await env.SUB_BUCKET.get('cft_api') : null;
								
				// const api = cft_api.split('\n');
				// api.map(line => {
				// 	const match = line.match(addressRegex);
				// 	if (match){
				// 		let path = "/?ed=2560&proxyIP=ProxyIP.US.CMLiussss.net";
				// 		const [, ipv4OrDomain, ipv6, port, name] = match;
				// 		const ipOrDomain = ipv6 ? `[${ipv6}]` : ipv4OrDomain;
				// 		const addressid = name;
				// 		if(socks5s.length > 0){
				// 			for (let item of socks5s) {
				// 				if (addressid.includes(item.type)) {
				// 					path = `/?ed=2560&socks5={item.socks5}`;
				// 					break; // 找到匹配项，跳出循环
				// 				}
				// 			}
				// 			//console.log(path);
				// 		}
				// 		path = encodeURIComponent(path);
				// 		const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=none&security=tls&sni=${cfhostt}&fp=random&type=ws&host=${cfhostt}&path=${path}#${addressid}`;
				// 		vlessLinks.push(vlessLink);

				// 		console.log(`地址：${ipOrDomain}，端口：${port}，名称：${addressid}`);
				// 	} else {
				// 		console.log(`无效的地址：${line}`);
				// 	}
				
				// });
			} else if(url.searchParams.get('client') && (url.searchParams.get('client').includes('book'))){
				
				//ipv4或ipv6域名识别
				const addressRegex = /^((?:\d{1,3}\.){3}\d{1,3}|\[([\da-f:]+)\]|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}):(\d+)#(.*)$/i;
				const bookaddressapi = env.SUB_BUCKET ? await env.SUB_BUCKET.get('addressapi') : null;

				const bookapi = bookaddressapi.split('\n');
				bookapi.map(line => {
					const match = line.match(addressRegex);
					if (match){
						const [, ipv4OrDomain, ipv6, port, name] = match;
						const ipOrDomain = ipv6 ? `[${ipv6}]` : ipv4OrDomain;
						const addressid = name;
						
						// let path = "/?ed=2560&proxyIP=ProxyIP.US.CMLiussss.net";
						let encryption = `${socks5s[2].encryption}`;
						let path = `/${socks5s[2].path}?ed=2560`;
						let hostbook = `${socks5s[2].socks5}`
						if(socks5s.length > 0){
							// path = `/?ed=2560&socks5=${socks5s[0].socks5}`;
							for (let item of socks5s) {
								if (addressid.includes(item.type)) {
									hostbook = `${item.socks5}`;
									// path = `/?ed=2560&socks5=${item.socks5}`;
									break; // 找到匹配项，跳出循环
								}
							}
							//console.log(path);
						}
						
						
						// if(socks5s.length > 0){
						// 	for (let item of socks5s) {
						// 		if (addressid.includes(item.type)) {
						// 			path = `/?ed=2560&socks5=${item.socks5}`;
						// 			break; // 找到匹配项，跳出循环
						// 		}
						// 	}
						// 	//console.log(path);
						// }
						// for (let item of CFCproxyIPs) {
						// 	if (addressid.includes(item.type)) {
						// 		path = `/proxyIP=${item.proxyIP}`;
						// 		break; // 找到匹配项，跳出循环
						// 	}
						// }
						path = encodeURIComponent(path);
						const vlessLink = `vless://${uuid}@${ipOrDomain}:${port}?encryption=${encryption}&security=tls&sni=${hostbook}&fp=chrome&type=ws&path=${path}#${addressid}`;
						vlessLinks.push(vlessLink);
						// console.log(`地址：${ipOrDomain}，端口：${port}，名称：${addressid}`);
					} else {
						console.log(`无效的地址：${line}`);
					}
				
				});
				
			}else {
				// Generate vlessLinks for ntlsports
				for (let i = 0; i < ntlsports.length; i++) {
					const port = ntlsports[i];
					const ip = i >= ntlsports.length - 3 ? bestcfip : bestproxyip;
					const vlessLink = `vless://${uuid}@${ip}:${port}?encryption=none&security=none&fp=random&type=ws&host=${host}&path=/=2560#CFWorker-${port}`;

					vlessLinks.push(vlessLink);
				}

				// Generate vlessLinks for tlsports
				for (let i = 0; i < tlsports.length; i++) {
					const port = tlsports[i];
					const ip = i >= tlsports.length - 3 ? bestcfip : bestproxyip;
					const vlessLink = `vless://${uuid}@${ip}:${port}?encryption=none&security=tls&sni=${host}&fp=random&type=ws&host=${host}&path=/?ed=2560#CFWorker-${port}`;;
					vlessLinks.push(vlessLink);
				}
			}

			// Join all vlessLinks with newline separator
			if (userAgent.includes('telegram') || userAgent.includes('twitter') || userAgent.includes('miaoko')) {
				return new Response('Hello World!');
			} else if (userAgent.includes('clash') || (format === 'clash' && !userAgent.includes('subconverter')) || (url.searchParams.get('client') && (url.searchParams.get('client').includes('clash')))) {
				//console.log(encodeURIComponent(responseBody));
				const responseBody = vlessLinks.join('|');
				const subconverterUrl = `https://${subconverter}/sub?target=clash&url=${encodeURIComponent(responseBody)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false&new_name=true`;
				//console.log(subconverterUrl);

			try {
				const subconverterResponse = await fetch(subconverterUrl);
				
				if (!subconverterResponse.ok) {
					throw new Error(`Error fetching subconverterUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
				}
				
				const subconverterContent = await subconverterResponse.text();
				
				return new Response(subconverterContent, {
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, {
					status: 500,
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
				}
			} else if (userAgent.includes('sing-box') || userAgent.includes('singbox')  || (format === 'singbox' && !userAgent.includes('subconverter')) || (url.searchParams.get('client') && (url.searchParams.get('client').includes('sing-box')))){
				const responseBody = vlessLinks.join('|');
				const subconverterUrl = `https://${subconverter}/sub?target=singbox&url=${encodeURIComponent(responseBody)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false&new_name=true`;

				try {
				const subconverterResponse = await fetch(subconverterUrl);
				
					if (!subconverterResponse.ok) {
						throw new Error(`Error fetching subconverterUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
					}
					
					const subconverterContent = await subconverterResponse.text();
					
					return new Response(subconverterContent, {
						headers: { 'content-type': 'text/plain; charset=utf-8' },
					});
				} catch (error) {
					return new Response(`Error: ${error.message}`, {
						status: 500,
						headers: { 'content-type': 'text/plain; charset=utf-8' },
					});
				}
			} else {
				const responseBody = vlessLinks.join('\n');
				const combinedContent = responseBody + '\n' + link; // 合并内容
				const base64Response = btoa(unescape(encodeURIComponent(combinedContent))); // 重新进行 Base64 编码

				const response = new Response(base64Response, {
				headers: { 'content-type': 'text/plain' },
				});

				return response;
			}
		}
				
		if (userAgent.includes('telegram') || userAgent.includes('twitter') || userAgent.includes('miaoko')) {
			return new Response('Hello World!');
		} else if (userAgent.includes('clash') || (format === 'clash' && !userAgent.includes('subconverter'))) {
			const subconverterUrl = `https://${subconverter}/sub?target=clash&url=${encodeURIComponent(request.url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false&new_name=true`;

			try {
				const subconverterResponse = await fetch(subconverterUrl);
				
				if (!subconverterResponse.ok) {
					throw new Error(`Error fetching subconverterUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
				}
				
				const subconverterContent = await subconverterResponse.text();
				
				return new Response(subconverterContent, {
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, {
					status: 500,
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
		} else if (userAgent.includes('sing-box') || userAgent.includes('singbox')){
			const subconverterUrl = `https://${subconverter}/sub?target=singbox&url=${encodeURIComponent(request.url)}&insert=false&config=${encodeURIComponent(subconfig)}&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false&new_name=true`;

			try {
			const subconverterResponse = await fetch(subconverterUrl);
			
				if (!subconverterResponse.ok) {
					throw new Error(`Error fetching subconverterUrl: ${subconverterResponse.status} ${subconverterResponse.statusText}`);
				}
				
				const subconverterContent = await subconverterResponse.text();
				
				return new Response(subconverterContent, {
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			} catch (error) {
				return new Response(`Error: ${error.message}`, {
					status: 500,
					headers: { 'content-type': 'text/plain; charset=utf-8' },
				});
			}
		} else {
			if(host.includes('workers.dev') || host.includes('pages.dev')) {
				if (proxyhostsURL) {
					try {
						const response = await fetch(proxyhostsURL); 
					
						if (!response.ok) {
							console.error('获取地址时出错:', response.status, response.statusText);
							return; // 如果有错误，直接返回
						}
					
						const text = await response.text();
						const lines = text.split('\n');
						// 过滤掉空行或只包含空白字符的行
						const nonEmptyLines = lines.filter(line => line.trim() !== '');
					
						proxyhosts = proxyhosts.concat(nonEmptyLines);
					} catch (error) {
						console.error('获取地址时出错:', error);
					}
				}
				// 使用Set对象去重
				proxyhosts = [...new Set(proxyhosts)];
			}
			
			const SUB_api = env.SUB_BUCKET ? await env.SUB_BUCKET.get('addressapi') : null;
			if(SUB_api !== null) {
				const newAddresses =  SUB_api;
				addresses = addresses.concat(newAddresses.split('\n'));
				//console.log(addresses);
			} else {
				const newAddressesapi = await getAddressesapi();
				const newAddressescsv = await getAddressescsv();
				addresses = addresses.concat(newAddressesapi);
				addresses = addresses.concat(newAddressescsv);
			}
			
			// 使用Set对象去重
			const uniqueAddresses = [...new Set(addresses)];
			
			const responseBody = uniqueAddresses.map(address => {
				let port = "8443";
				let addressid = address;
				//console.log(address);
				if (address.includes(':') && address.includes('#')) {
					const parts = address.split(':');
					address = parts[0];
					const subParts = parts[1].split('#');
					port = subParts[0];
					addressid = subParts[1];
				} else if (address.includes(':')) {
					const parts = address.split(':');
					address = parts[0];
					port = parts[1];
				} else if (address.includes(',')) {
					const parts = address.split(',');
					const spaces = parts.length;
					if (spaces == 2){
						address = parts[0];
						port = parts[1];
					}
					else if(spaces >= 3){
						address = parts[0];
						port = parts[1];
						addressid = parts[2];
					}
				} else if (address.includes('#')) {
					const parts = address.split('#');
					address = parts[0];
					addressid = parts[1];
				}
			
				if (addressid.includes(':')) {
					addressid = addressid.split(':')[0];
				}
				
				edgetunnel = url.searchParams.get('edgetunnel') || edgetunnel;
				RproxyIP = url.searchParams.get('proxyip') || RproxyIP;
				if (edgetunnel.trim() === 'cmliu' && RproxyIP.trim() === 'true') {
					// 将addressid转换为小写
					let lowerAddressid = addressid.toLowerCase();
					// 随机选择一个proxyIP
					const randomProxyIP = proxyIPs[Math.floor(Math.random() * proxyIPs.length)];
					path = `/proxyIP=${randomProxyIP}`;

					if(socks5s.length > 0){
						path = `/socks5://${socks5s[1].socks5}`;
						for (let item of socks5s) {
							if (addressid.includes(item.type)) {
								path = `/socks5://${item.socks5}`;
								break; // 找到匹配项，跳出循环
							}
						}
						//console.log(path);
					}
					
				}

				let 伪装域名 = host ;				
				let 最终路径 = path ;
				let 节点备注 = EndPS ;
				if(proxyhosts && (host.includes('workers.dev') || host.includes('pages.dev'))) {
					最终路径 = `/${host}${path}`;
					伪装域名 = proxyhosts[Math.floor(Math.random() * proxyhosts.length)];
					节点备注 = `${EndPS} 已启用临时域名中转服务，请尽快绑定自定义域！`;
				}
				const vlessLink = `vless://${uuid}@${address}:${port}?encryption=none&security=tls&sni=${伪装域名}&fp=random&type=ws&host=${伪装域名}&path=${encodeURIComponent(最终路径)}#${encodeURIComponent(addressid + 节点备注)}`;
			
				return vlessLink;
			}).join('\n');
			
			const combinedContent = responseBody + '\n' + link; // 合并内容
			const base64Response = btoa(unescape(encodeURIComponent(combinedContent))); // 重新进行 Base64 编码

			const response = new Response(base64Response, {
			headers: { 'content-type': 'text/plain' },
			});

			return response;
		}
	}
};
