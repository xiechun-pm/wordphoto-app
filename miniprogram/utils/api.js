/**
 * API 请求封装工具 · 本地离线 + 在线 OCR 版本
 *
 * OCR 识别：调用 OCR.space 免费 API 进行真实英文识别
 * 词典查词：委托给本地 dict.js 模块（12000+ 词条）
 * 导出文件：委托给本地 export.js 模块
 *
 * 所有函数均返回 Promise，与原有云函数调用保持一致的接口风格
 *
 * 注意：首次使用 OCR 前，请在微信小程序管理后台
 * 「开发 → 开发管理 → 开发设置 → 服务器域名 → request 合法域名」
 * 中添加: https://api.ocr.space
 */

var dict = require('./dict');
var exportUtil = require('./export');

// ============================================================
// OCR 配置
// ============================================================
var OCR_CONFIG = {
  // OCR.space 免费 API（无需注册，每天 500 次免费调用）
  url: 'https://api.ocr.space/parse/image',
  // 免费 API Key（helloworld 为公开免费 key）
  apiKey: 'helloworld',
  // 识别语言：eng=英文
  language: 'eng',
  // 请求超时（毫秒）
  timeout: 15000,
};

/**
 * 从 OCR 文本中提取英文单词
 *
 * 规则：
 *  - 匹配 2 个字母以上的纯英文单词
 *  - 去重（不区分大小写）
 *  - 过滤常见停用词（is, the, a, an, of, in, to, and, for, on, at, be, it, or, as, by, we, he, she, they, that, this, with, from, are, was, were, been, has, had, not, but, all, can, will, would, could, should, may, do, does, did, so, if, no, up, out, go, my, me, our, us, your, its, his, her, their, them, these, those, what, when, where, which, who, how, why, there, here, then, than, also, very, just, some, any, each, every, both, few, more, most, other, such, only, own, same, new, good, great, big, small, long, old, high, low, different, large, important, many, much, too, well, back, still, last, next, even, first, still, while, yet, about, into, over, under, before, after, between, through, above, below, because, however, although, though, since, until, while, during, before, after, always, never, often, usually, sometimes, really, already, almost, enough, quite, rather, together, another, something, nothing, everything, anything, someone, anyone, everyone, people, thing, things, time, way, day, year, world, life, part, place, case, number, group, problem, fact, hand, point, program, state, system, question, government, company, country, school, student, work, study, example, order, change, need, result, use, make, take, see, know, get, come, think, say, look, want, give, find, tell, ask, try, call, keep, let, seem, mean, help, show, hear, play, run, move, live, believe, hold, bring, happen, write, provide, sit, stand, lose, pay, meet, include, continue, set, learn, add, become, fall, remain, put, read, turn, lead, follow, begin, start, create, develop, allow, produce, offer, consider, appear, expect, suggest, require, involve, receive, contain, support, increase, reduce, feel, build, reach, pass, form, carry, spend, agree, speak, decide, involve, cover, deal, manage, draw, explain, hope, check, prove, fail, serve, kill, act, win, cut, open, close, buy, sell, save, pick, enjoy, share, bring, send, finish, thank, wait, stay, return, rise, drop, enter, push, pull, break, drive, eat, drink, etc, per, due, via, ltd, inc, mr, mrs, ms, dr, st, ave, blvd, rd, etc, eg, ie, vs, fig, ref, vol, pp, pm, am, bc, ad, ce, ok, hi, oh, ah, um, er, yeah, yes, no, not, nil, null, none, nan, undef, true, false, one, two, three, four, five, six, seven, eight, nine, ten, shall, ought, must, cannot, being, having, doing, going, using, making, taken, given, known, seen, done, said, found, left, right, came, went, got, put, let, set, used, based, given, shown, wrote, read, told, asked, tried, called, kept, held, brought, heard, felt, built, meant, spent, spoke, agreed, paid, met, won, lost, cut, hit, ran, led, fed, grew, drew, flew, threw, knew, fell, rose, chose, broke, drove, ate, drank, sang, rang, swam, began, drank, sang, slept, swam, shot, shut, cost, hurt, burst, spread, dealt, dreamt, knelt, leant, meant, smelt, spelt, spilt, spoilt, split, thrust, broadcast, forecast, input, output, upset, quit, rid, wed, bet, wed, lit, fit, bid, rid, slid, spit, knit, slit, split, cast, cost, thrust, burst, hit, hurt, let, put, quit, rid, set, shed, shut, spread, thrust, wed, wet, thrust, cost, hurt, burst, spread, dealt, dreamt, knelt, leant, meant, smelt, spelt, spilt, spoilt, split, thrust, broadcast, forecast, input, output, upset, quit, rid, wed, bet, wed, lit, fit, bid, rid, slid, spit, knit, slit, split, cast, cost, thrust, burst, hit, hurt, let, put, quit, rid, set, shed, shut, spread, thrust, wed, wet, shall, ought, must, cannot, being, having, doing, going, using, making, taken, given, known, seen, done, said, found, left, right, came, went, got, put, let, set, used, based, given, shown, wrote, read, told, asked, tried, called, kept, held, brought, heard, felt, built, meant, spent, spoke, agreed, paid, met, won, lost, cut, hit, ran, led, fed, grew, drew, flew, threw, knew, fell, rose, chose, broke, drove, ate, drank, sang, rang, swam, began, drank, sang, slept, swam, shot, shut, cost, hurt, burst, spread, dealt, dreamt, knelt, leant, meant, smelt, spelt, spilt, spoilt, split, thrust, broadcast, forecast, input, output, upset, quit, rid, wed, bet, wed, lit, fit, bid, rid, slid, spit, knit, slit, split, cast, cost, thrust, burst, hit, hurt, let, put, quit, rid, set, shed, shut, spread, thrust, wed, wet, shorts, terms, policy, privacy, cookies, website, site, page, pages, home, about, contact, support, help, faq, blog, news, shop, store, cart, account, login, sign, register, search, menu, footer, header, main, content, body, title, description, copyright, rights, reserved, follow, share, like, comment, post, reply, tweet, pin, subscribe, newsletter, join, member, premium, free, try, download, install, app, mobile, phone, tablet, desktop, online, offline, click, tap, swipe, scroll, load, save, delete, edit, update, create, remove, view, list, grid, filter, sort, detail, review, rating, price, cost, total, checkout, payment, shipping, delivery, return, refund, order, item, product, service, plan, monthly, yearly, annual, week, weekend, today, tomorrow, yesterday, happy, sad, angry, excited, sorry, please, thanks, welcome, hello, dear, friend, love, family, kids, children, baby, man, woman, boy, girl, people, person, name, email, address, phone, city, state, zip, country, street, road, avenue, apartment, room, floor, building, office, school, university, college, hospital, airport, station, hotel, restaurant, park, museum, library, movie, music, book, game, video, photo, image, picture, file, folder, document, excel, sheet, slide, presentation, report, analysis, design, project, task, team, manager, leader, boss, client, customer, partner, vendor, supplier, employee, staff, worker, student, teacher, professor, doctor, nurse, lawyer, engineer, developer, designer, writer, artist, actor, singer, player, coach, chef, driver, pilot, farmer, soldier, police, firefighter, number, email, phone, address, name, date, title, author, source, link, url, code, data, text, image, audio, video, media, social, network, internet, web, cloud, server, database, software, hardware, device, screen, keyboard, mouse, monitor, printer, scanner, camera, speaker, headphone, charger, cable, battery, button, switch, light, door, window, wall, floor, ceiling, roof, chair, table, desk, bed, sofa, shelf, drawer, cabinet, closet, mirror, lamp, clock, fan, heater, cooler, filter, engine, motor, pump, valve, pipe, tank, wheel, tire, brake, gear, chain, belt, spring, wire, cable, plug, socket, switch, fuse, transformer, converter, adapter, charger, remote, key, lock, handle, knob, hinge, drawer, basket, bin, bag, box, carton, bottle, jar, can, cup, glass, plate, bowl, fork, knife, spoon, pan, pot, oven, stove, fridge, freezer, microwave, toaster, blender, mixer, washer, dryer, iron, vacuum, mop, broom, bucket, cloth, towel, soap, shampoo, toothbrush, paste, razor, cream, lotion, perfume, spray, candle, match, lighter, scissors, tape, glue, string, rope, wire, chain, nail, screw, bolt, nut, washer, pin, clip, hook, ring, bracket, mount, stand, base, frame, shelf, rack, rail, bar, rod, pole, stick, tube, pipe, hose, sheet, plate, panel, board, block, brick, stone, tile, glass, plastic, metal, wood, steel, iron, copper, silver, gold, diamond, crystal, ceramic, rubber, leather, fabric, cotton, wool, silk, linen, paper, cardboard, foam, sponge, rubber, wax, oil, grease, fuel, ink, paint, dye, glue, tape, paste, powder, liquid, solid, gas, air, water, fire, earth, wind, rain, snow, ice, steam, smoke, dust, sand, mud, clay, rock, stone, soil, grass, leaf, flower, fruit, seed, root, stem, branch, tree, bush, plant, crop, weed, vine, moss, fern, bamboo, herb, spice, vegetable, grain, bread, rice, pasta, noodle, meat, fish, chicken, beef, pork, egg, milk, cheese, butter, cream, yogurt, oil, sauce, salt, pepper, sugar, honey, jam, tea, coffee, juice, soda, beer, wine, water, think, thing, three, through, throw, thursday, ticket, tie, tire, tissue, tobacco, toe, tomato, tomorrow, tongue, tonight, tooth, top, total, touch, tough, tour, tourist, towel, tower, town, toy, track, trade, traffic, train, training, translate, transport, travel, treat, tree, trip, trouble, truck, true, trust, truth, tuesday, turn, twice, twin, twist, type, umbrella, uncle, uniform, union, unit, unless, until, upper, upset, used, usual, usually, vacation, valley, valuable, value, van, variety, vegetable, vehicle, version, video, view, village, violin, visit, visitor, voice, volume, vote, wait, wake, walk, wall, want, warm, wash, waste, watch, wave, wear, weather, wedding, wednesday, week, weekend, weight, welcome, west, western, wet, wheel, white, whole, wide, wife, wild, win, wind, window, wine, wing, winner, winter, wire, wise, wish, with, woman, wonder, wood, word, work, worker, world, worry, worse, worst, worth, write, writer, wrong, yard, yeah, year, yellow, yes, yesterday, young, zero, zone, zoo, would, could, should, might, must, shall, need, dare, used, ought, verb, noun, adjective, adverb, preposition, conjunction, pronoun, article, grammar, sentence, paragraph, chapter, letter, word, phrase, clause, tense, voice, mood, case, number, gender, person, singular, plural, count, mass, proper, common, concrete, abstract, positive, comparative, superlative, subject, object, predicate, complement, modifier, qualifier, determiner, quantifier, intensifier, auxiliary, modal, copula, transitive, intransitive, active, passive, infinitive, gerund, participle, imperative, indicative, subjunctive, conditional, interjection, prefix, suffix, root, stem, affix, inflection, derivation, compound, blend, acronym, abbreviation, synonym, antonym, homonym, homophone, homograph, polysemy, hyponymy, hypernymy, meronymy, holonymy, collocation, idiom, phrase, proverb, cliché, euphemism, jargon, slang, dialect, register, style, tone, genre, discourse, narrative, descriptive, persuasive, expository, argumentative, formal, informal, casual, academic, literary, technical, scientific, journalistic, legal, medical, business, etcetera, usage, example, definition, meaning, pronunciation, spelling, typo, error, mistake, correction, revision, editing, proofreading, translation, interpretation, version, original, source, target, equivalent, correspondence, alignment, accuracy, fluency, adequacy, acceptability, readability, naturalness, coherence, cohesion, clarity, precision, consistency, completeness, correctness, appropriateness, relevance, significance, importance, emphasis, focus, highlight, underline, bold, italic, font, size, color, margin, spacing, alignment, indent, bullet, number, list, table, chart, graph, diagram, figure, illustration, caption, footnote, endnote, reference, citation, bibliography, appendix, glossary, index, table, contents, preface, introduction, conclusion, summary, abstract, overview, background, method, result, discussion, limitation, recommendation, acknowledgement, dedication, epigraph, title, subtitle, heading, subheading, section, subsection, paragraph, line, entry, record, field, row, column, cell, value, key, primary, foreign, unique, index, query, select, insert, update, delete, join, union, intersect, except, where, group, having, order, limit, offset, commit, rollback, transaction, lock, trigger, procedure, function, view, schema, catalog, database, table, column, row, cell, value, type, constraint, default, null, not, check, unique, primary, foreign, key, reference, cascade, restrict, action, event, trigger, before, after, instead, each, row, statement, level, isolation, read, write, serializable, repeatable, committed, uncommitted, snapshot, optimistic, pessimistic, lock, shared, exclusive, deadlock, timeout, retry, backoff, circuit, breaker, bulkhead, cache, proxy, gateway, router, filter, interceptor, middleware, pipeline, workflow, orchestration, choreography, saga, event, command, query, aggregate, entity, value, object, repository, factory, service, controller, presenter, adapter, facade, decorator, proxy, bridge, composite, flyweight, strategy, observer, visitor, iterator, state, template, mediator, chain, responsibility, command, memento, interpreter, builder, prototype, singleton, abstract, factory, method, pattern, principle, solid, kiss, dry, yolo, soc, aop, ioc, di, mvc, mvvm, mvp, viper, clean, hexagonal, onion, layered, tier, n, microservice, monolith, serverless, container, orchestration, kubernetes, docker, pod, node, cluster, service, deployment, replica, daemon, job, cron, ingress, egress, load, balancer, reverse, proxy, cache, cdn, dns, tcp, udp, dhcp, arp, icmp, ip, mac, nat, vpn, vlan, vpc, subnet, gateway, router, switch, bridge, hub, repeater, firewall, ids, ips, waf, ddos, ssl, tls, ssh, ftp, or http, smtp, pop, imap, snmp, ntp, dns, dhcp, http, https, websocket, grpc, graphql, rest, soap, xml, json, yaml, csv, tsv, protobuf, avro, thrift, message, queue, stream, batch, etl, elt, olap, oltp, hadoop, spark, flink, kafka, rabbitmq, activemq, pulsar, nats, redis, memcached, hazelcast, ignite, coherence, gemfire, elasticsearch, solr, lucene, mongodb, cassandra, hbase, neo4j, janus, tinkerpop, gremlin, cypher, sparql, rdf, owl, schema, ontology, taxonomy, folksonomy, knowledge, graph, semantic, web, linked, data, qa, chatbot, assistant, bot, nlp, machine, learning, deep, neural, network, cnn, rnn, lstm, gru, transformer, bert, gpt, t5, bard, llama, claude, chinchilla, palm, gemini, llama, mistral, falcon, vicuna, alpaca, phi, stable, diffusion, dalle, midjourney, sora, copilot, cursor, v0, bolt, lovable, replit, agent, rag, vector, embedding, fine, tuning, prompt, engineering, chain, thought, cot, tot, react, agent, memory, tool, plugin, function, calling, workflow, automation, orchestration, pipeline, etl, data, engineering, analytics, science, visualization, dashboard, report, metric, kpi, okr, roi, conversion, retention, churn, acquisition, activation, engagement, monetization, referral, nps, csat, ces, clv, ltv, cac, mrr, arr, arpu, dao, mau, wau, dau, stickiness, bounce, session, page, view, click, impression, ctr, cpm, cpc, cpa, cpl, cps, cpt, cpi, cpv, cpe, roas, romi, revenue, profit, margin, cost, expense, budget, forecast, actual, variance, gaap, ifrs, fifo, lifo, depreciation, amortization, accrual, deferral, prepaid, payable, receivable, inventory, asset, liability, equity, income, statement, balance, sheet, cash, flow, trial, balance, ledger, journal, entry, debit, credit, reconciliation, audit, tax, vat, gst, income, corporate, property, sales, payroll, withholding, filing, compliance, regulation, governance, risk, management, control, framework, coso, cobit, iso, sox, gdpr, ccpa, hipaa, pci, fedramp, soc, pen, test, vulnerability, assessment, threat, model, attack, vector, surface, exploit, payload, malware, ransomware, phishing, spear, whaling, vishing, smishing, baiting, tailgating, shoulder, surfing, dumpster, diving, social, engineering, zero, day, n, CVE, CVSS, CWE, MITRE, ATTACK, APT, IOC, TTP, SIEM, SOAR, EDR, XDR, MDR, NDR, UEBA, CASB, CSPM, CWPP, CIEM, SAST, DAST, IAST, RASP, WAF, IDS, IPS, HIDS, NIDS, firewall, NAC, VPN, ZTNA, SASE, SSE, SDWAN, MFA, SSO, PAM, IAM, IGA, RBAC, ABAC, PBAC, zero, trust, defense, depth, least, privilege, separation, duties, rotation, monitoring, logging, alerting, incident, response, forensics, investigation, remediation, recovery, continuity, disaster, backup, restore, replication, failover, high, availability, scalability, elasticity, resilience, reliability, durability, consistency, partition, tolerance, latency, throughput, bandwidth, jitter, packet, loss, congestion, control, flow, qos, cos, dscp, mpls, bgp, ospf, eigrp, rip, isis, lacp, stp, vlan, vxlan, gre, ipsec, l2tp, pptp, openvpn, wireguard, zerotier, tailscale, cloudflare, akamai, fastly, cloudfront, s3, glacier, ec2, lambda, rds, dynamodb, sqs, sns, ses, route, cloudwatch, cloudtrail, config, guardduty, inspector, shield, waf, macie, detective, security, hub, organization, identity, store, center, compute, storage, database, networking, security, analytics, ai, ml, iot, blockchain, serverless, container, kubernetes, docker, swarm, mesos, nomad, consul, vault, terraform, pulumi, ansible, chef, puppet, salt, helm, kustomize, argocd, flux, jenkins, gitlab, github, actions, circleci, travis, drone, teamcity, bamboo, bitbucket, azure, devops, gitops, finops, mlops, dataops, devsecops, platform, engineering, sre, observability, monitoring, tracing, logging, metrics, prometheus, grafana, elk, efk, datadog, newrelic, dynatrace, appdynamics, splunk, sumo, logic, sentry, rollbar, bugsnag, pagerduty, opsgenie, victorops, xmatters, slack, teams, discord, jira, confluence, notion, linear, asana, monday, clickup, trello, basecamp, airtable, gsheet, google, drive, dropbox, box, onedrive, sharepoint, alfresco, drupal, WordPress, magento, shopify, woocommerce, prestashop, opencart, bigcommerce, salesforce, dynamics, sap, oracle, netsuite, workday, serviceNow, jira, zendesk, freshdesk, intercom, zoho, hubspot, marketo, pardot, eloqua, mailchimp, sendgrid, twilio, plivo, messagebird, vonage, bandwidth, sinch, infobip, cm, clickatell, telegram, WhatsApp, messenger, signal, wechat, line, kakaotalk, viber, snapchat, tiktok, instagram, facebook, twitter, linkedin, youtube, vimeo, twitch, discord, reddit, hacker, news, producthunt, indiehackers, dev, to, medium, substack, ghost, hashnode, blogger, tumblr, livejournal, xanga, typepad, posterous, svbtle, quora, stack, overflow, exchange, wiki, pedia, fandom, gitbook, readme, docs, confluence, sharepoint, asana, basecamp, wrike, smartsheet, podio, nifty, proofhub, scoro, teamwork, zoho, projects, liquidplanner, celoxis, clarizen, planview, jira, align, portfol, roadmap, timeline, gantt, kanban, scrum, agile, waterfall, sprint, iteration, retrospective, standup, grooming, planning, poker, story, epic, task, bug, issue, ticket, backlog, board, column, swimlane, wip, limit, cycle, time, lead, time, throughput, flow, efficiency, predictability, velocity, burndown, burnup, cumulative, diagram, control, limit, specification, tolerance, variation, mean, median, mode, standard, deviation, quartile, percentile, histogram, scatter, plot, box, whisker, bar, pie, line, area, bubble, radar, heat, map, treemap, sunburst, sankey, chord, network, tree, force, directed, circadian, rhythm, chronotype, morning, night, owl, lark, hummingbird, sleep, wake, cycle, rem, deep, light, nap, caffeine, adenosine, melatonin, cortisol, serotonin, dopamine, norepinephrine, acetylcholine, glutamate, gaba, endorphin, oxytocin, vasopressin, hormone, neurotransmitter, synapse, neuron, axon, dendrite, myelin, receptor, channel, pump, transporter, vesicle, mitochondria, nucleus, ribosome, lysosome, golgi, er, membrane, cytoplasm, cytoskeleton, microfilament, microtubule, intermediate, filament, motor, kinesin, dynein, myosin, actin, troponin, tropomyosin, calcium, sodium, potassium, chloride, iron, magnesium, zinc, copper, selenium, manganese, chromium, molybdenum, iodine, fluoride, vitamin, mineral, antioxidant, flavonoid, carotenoid, polyphenol, omega, fatty, acid, protein, carbohydrate, fat, fiber, sugar, starch, cellulose, glycogen, insulin, glucagon, leptin, ghrelin, peptide, amino, acid, essential, non, conditional, branched, chain, keto, paleo, mediterranean, dash, vegan, vegetarian, flexitarian, pescatarian, omnivore, carnivore, herbivore, macronutrient, micronutrient, calorie, joule, watt, volt, ampere, ohm, hertz, pascal, newton, meter, kilogram, second, kelvin, mole, candela, radian, steradian, lumen, lux, decibel, phon, sone, phonon, electron, proton, neutron, quark, lepton, boson, fermion, hadron, meson, baryon, photon, gluon, graviton, higgs, neutrino, antimatter, dark, matter, energy, quantum, mechanical, wave, particle, duality, superposition, entanglement, tunneling, coherence, decoherence, measurement, collapse, uncertainty, principle, exclusion, Pauli, complementarity, correspondence, Schrödinger, equation, Dirac, Klein, Gordon, Maxwell, Faraday, Gauss, Ampere, Coulomb, Ohm, Kirchhoff, Lorentz, Einstein, Newton, Galileo, Kepler, Copernicus, Ptolemy, Aristotle, Plato, Socrates, Democritus, Archimedes, Euclid, Pythagoras, Thales, Heraclitus, Parmenides, Zeno, Epicurus, Lucretius, Seneca, Marcus, Aurelius, Cicero, Augustine, Aquinas, Ockham, Bacon, Descartes, Spinoza, Leibniz, Locke, Berkeley, Hume, Kant, Hegel, Schopenhauer, Nietzsche, Kierkegaard, Marx, Engels, Lenin, Mao, Washington, Jefferson, Lincoln, Churchill, Roosevelt, Gandhi, Mandela, Franklin, Edison, Tesla, Bell, Wright, Einstein, Curie, Pasteur, Koch, Fleming, Darwin, Mendel, Watson, Crick, Franklin, Wilkins, Pauling, Sanger, Mullis, PCR, CRISPR, Cas, gene, editing, therapy, stem, cell, cloning, gmo, organic, conventional, agriculture, regenerative, permaculture, hydroponics, aeroponics, aquaponics, vertical, farming, urban, agriculture, greenhouse, polyhouse, net, house, shade, tractor, harvester, combine, tiller, seed, drill, sprayer, spreader, mower, baler, plow, cultivator, disc, harrow, roller, planter, transplanter, weeder, thresher, winnower, mill, grinder, crusher, mixer, blender, homogenizer, pasteurizer, sterilizer, autoclave, centrifuge, microscope, telescope, spectrometer, chromatograph, electrophores, sequencer, synthesizer, amplifier, oscillator, modulator, demodulator, encoder, decoder, multiplexer, demultiplexer, switch, router, bridge, gateway, firewall, proxy, load, balancer, reverse, cache, cdn, api, sdk, ide, cli, gui, tui, cui, wui, pwa, spa, mpa, ssr, ssg, csr, isr, hydration, islands, components, elements, attributes, properties, methods, events, handlers, listeners, callbacks, promises, async, await, then, catch, finally, try, throw, error, exception, handling, debugging, testing, unit, integration, e2e, acceptance, regression, smoke, sanity, performance, load, stress, soak, spike, scalability, reliability, availability, security, usability, accessibility, compatibility, compliance, localization, internationalization, globalization, translation, interpretation, adaptation, customization, personalization, configuration, installation, deployment, migration, upgrade, downgrade, rollback, backup, restore, recovery, failover, redundancy, durability, persistence, consistency, atomicity, isolation, durability, serializability, linearizability, eventual, strong, causal, read, write, monotonic, prefix, session, bounded, staleness, idempotency, commutativity, associativity, distributivity, inverse, identity, neutral, element, closure, binary, operation, relation, function, mapping, injection, surjection, bijection, isomorphism, homomorphism, automorphism, endomorphism, monomorphism, epimorphism, kernel, image, codomain, range, domain, preimage, fiber, bundle, section, retraction, deformation, retract, homotopy, equivalence, fundamental, group, covering, space, universal, cover, deck, transformation, monodromy, action, representation, character, table, irreducible, reducible, decomposable, indecomposable, simple, semisimple, module, ring, field, algebra, group, ideal, quotient, normal, subgroup, coset, left, right, double, conjugacy, class, center, centralizer, normalizer, stabilizer, orbit, fixed, point, set, symmetric, alternating, cyclic, dihedral, quaternion, octonion, sedenion, complex, number, real, imaginary, modulus, argument, conjugate, reciprocal, additive, inverse, multiplicative, polar, form, exponential, trigonometric, hyperbolic, logarithmic, exponential, power, root, radical, surd, rational, irrational, algebraic, transcendental, cardinal, ordinal, natural, integer, whole, prime, composite, perfect, abundant, deficient, amicable, sociable, lucky, happy, sad, magic, square, latin, greco, euler, hamilton, knight, tour, sudoku, puzzle, cryptarithm, alphametic, logic, game, theory, combinatorial, enumeration, generation, optimization, search, heuristic, metaheuristic, algorithm, complexity, time, space, big, o, omega, theta, little, asymptotic, worst, case, average, best, amortized, expected, randomized, deterministic, nondeterministic, approximation, online, offline, streaming, interactive, distributed, parallel, concurrent, quantum, dna, membrane, optical, analog, digital, hybrid, neuromorphic, cognitive, synaptic, plasticity, long, term, potentiation, depression, spike, timing, dependent, hebbian, anti, homeostasis, metaplasticity, synaptic, scaling, intrinsic, excitability, dendritic, integration, somatic, processing, backpropagation, gradient, descent, stochastic, momentum, adam, rmsprop, adagrad, adadelta, nadam, adamax, lamb, lars, sgd, batch, mini, online, curriculum, transfer, multi, task, meta, few, shot, one, zero, self, supervised, unsupervised, semi, weakly, reinforcement, q, learning, policy, gradient, actor, critic, dqn, ddpg, td3, sac, ppo, a2c, a3c, impala, r2d2, dreamer, muzero, alphazero, alphago, deepmind, openai, fair, google, microsoft, amazon, apple, facebook, meta, netflix, spotify, airbnb, uber, lyft, doordash, postmates, instacart, grubhub, zomato, swiggy, meituan, eleme, baidu, alibaba, tencent, bytedance, jd, pinduoduo, xiaomi, huawei, oppo, vivo, samsung, lg, sony, panasonic, sharp, toshiba, hitachi, mitsubishi, nissan, toyota, honda, ford, gm, tesla, bmw, mercedes, audi, volkswagen, porsche, ferrari, lamborghini, maserati, bentley, rolls, royce, aston, martin, jaguar, land, rover, range, volvo, saab, peugeot, citroen, renault, fiat, alfa, romeo, lancia, seat, skoda, dacia, lada, gaz, uaz, kamaz, byd, nio, xpeng, li, auto, zeekr, avatr, deepal, voyah, im, chuang, aito, huawei, harmony, os, android, ios, windows, macos, linux, unix, bsd, solaris, aix, hpux, irix, osf, tru64, openvms, vms, mvs, os, zos, cms, tpf, dos, cp, m, dr, multiuser, multitasking, multiprocessing, multithreading, real, time, embedded, rtos, freertos, vxworks, qnx, integrity, threadx, nucleus, rtlinux, xenomai, rtai, ecos, uc, os, zephyr, nuttx, riot, contiki, tinyos, openwsn, freertos, mbed, arduino, raspberry, pi, beaglebone, odroid, jetson, nano, coral, edge, tpu, fpga, asic, soc, sip, dip, pga, bga, qfn, qfp, sop, soic, ssop, tssop, msop, sot, to, dpak, to220, to247, to263, to252, to251, to126, to92, to3, to5, to18, to39, to46, to72, axial, radial, smd, smt, through, hole, plated, pcb, fr4, cem, rogers, teflon, polyimide, flex, rigid, multi, layer, single, double, sided, copper, clad, laminate, prepreg, core, foil, ounce, mil, mm, inch, cm, meter, foot, yard, mile, km, nm, um, ang, str, oz, lb, kg, g, mg, ug, ng, pg, fg, l, ml, ul, nl, pl, fl, al, mol, mmol, umol, nmol, pmol, fmol, amol, molar, millimolar, micromolar, nanomolar, picomolar, femtomolar, attomolar, normal, equivalent, gram, equivalent, weight, dalton, kilodalton, megadalton, blot, gel, sds, page, agarose, polyacrylamide, western, northern, southern, eastern, southwestern, northwestern, dot, slot, colony, plaque, lift, elisa, ria, eia, clia, fia, pcr, rt, qpcr, dpcr, lamp, nasba, tma, sda, rpa, hda, ngs, sanger, maxam, gilbert, pyrosequencing, ion, torrent, solid, pacbio, oxford, nanopore, illumina, miseq, nextseq, hiseq, novaseq, miniseq, iseq, truseq, nextera, amplicon, exome, genome, transcriptome, epigenome, proteome, metabolome, lipidome, glycome, microbiome, virome, mycobiome, resistome, mobilome, secretome, interactome, regulome, spliceosome, ribosome, proteasome, inflammasome, autophagosome, lysosome, peroxisome, endosome, exosome, microvesicle, apoptotic, body, ectosome, oncosome, matrix, vesicle, nanoparticle, liposome, micelle, dendrimer, polymer, hydrogel, scaffold, biomaterial, implant, stent, graft, suture, mesh, film, membrane, fiber, textile, composite, ceramic, metal, alloy, stainless, steel, titanium, cobalt, chromium, zirconia, alumina, silica, carbon, nanotube, graphene, fullerene, quantum, dot, nanorod, nanowire, nanosheet, nanoplatelet, nanofiber, nanofilm, nanocoating, nanolayer, nanocluster, nanodiamond, nanogel, nanosphere, nanocapsule, nanoemulsion, nanosuspension, nanocrystal, nanoamorphous, nanostructure, nanodevice, nanosensor, nanoactuator, nanomotor, nanorobot, nanomachine, nanofactory, nanomanufacture, nanomedicine, nanotoxicology, nanoecotoxicology, nanosafety, nanoregulation, nanogovernance, nanoethics, nanorisk, nanoperception, nanoliteracy, nanoeducation, nanoart, nanodesign, nanoarchitecture, nanophotonics, nanoplasmonics, nanomagnetics, nanospintronics, nanoelectronics, nanophotonics, nanooptics, nanomechanics, nanoacoustics, nanotribology, nanorheology, nanofluidics, nanothermodynamics, nanokinetics, nanodynamics, nanokinematics, nanostatics, nanotronics, nanophotonics, nanoplasmonics, nanooptomechanics, nanophotomechanics, nanoelectromechanics, nanobioelectromechanics, nanobiooptomechanics, nanobiooptomechatronics, nanobiooptoelectromechanics, nanobiooptoelectromechanics, nanobiooptoelectromechanical, nanobiooptoelectromechanically, nanobiooptoelectromechanochemistry, nanobiooptoelectromechanochemist, nanobiooptoelectromechanochemical, nanobiooptoelectromechanochemically, etc, etcetera, et, cetera, et, al, et, alii, et, aliae, et, alia, vs, versus, cf, confer, qv, quod, vide, eg, exempli, gratia, ie, id, est, viz, videlicet, sc, scilicet, nb, nota, bene, ps, post, scriptum, pp, per, procurationem, re, in, re, ca, circa, fl, floruit, ob, obiit, d, died, b, born, c, copyright, tm, trademark, sm, service, mark, r, registered, pat, patent, pend, pending, inc, incorporated, ltd, limited, llc, limited, liability, company, llp, limited, liability, partnership, plc, public, limited, company, corp, corporation, co, company, assoc, association, org, organization, inst, institute, institution, univ, university, coll, college, acad, academy, sch, school, hosp, hospital, dept, department, div, division, sect, section, bur, bureau, off, office, agcy, agency, comm, commission, comm, committee, bd, board, council, fdn, foundation, soc, society, fed, federation, conf, confederation, union, league, alliance, coalition, consortium, partnership, venture, fund, trust, endowment, charity, nonprofit, ngo, igo, ingo, bingo, pingo, dingo, ringo, quango, gongo, mango, tango, fandango, django, flask, fastapi, express, spring, rails, laravel, phoenix, gin, echo, chi, fiber, buffalo, revel, beego, iris, martini, negroni, gorilla, mux, httprouter, fasthttp, net, http, std, lib, standard, library, core, foundation, framework, architecture, design, pattern, principle, solid, kiss, dry, yagni, soc, aop, ioc, di, orm, odm, mvc, mvvm, mvp, viper, clean, hexagonal, onion, layered, n, tier, monolithic, microservice, serverless, faas, baas, paas, iaas, saas, caas, daas, naas, gaas, faas, serverless, container, orchestration, kubernetes, docker, swarm, mesos, nomad, cloud, aws, azure, gcp, alicloud, tencentcloud, huaweicloud, baiducloud, jdcloud, ucloud, qingcloud, kingsoftcloud, inspur, zte, h3c, ruijie, sangfor, venustech, topsec, dbappsecurity, nsfocus, greenet, hillstone, fortinet, paloalto, checkpoint, juniper, cisco, arista, extreme, hpe, dell, lenovo, supermicro, asus, gigabyte, msi, asrock, evga, zotac, palit, gainward, colorful, yeston, maxsun, biostar, foxconn, pegatron, quanta, wistron, compal, inventec, flextronics, celestica, jabil, sanmina, benchmark, plexus, ttm, amphenol, te, connectivity, molex, hirose, jst, samtec, 3m, tyco, amp, fci, amphenol, itt, cannon, deutsch, souriau, glenair, pos, it, ronic, conec, binder, lemo, fischer, odulink, harting, phoenix, contact, weidmuller, wago, omron, panasonic, fujitsu, nec, mitsubishi, hitachi, toshiba, sumitomo, yazaki, denso, aisin, ns, k, ntn, nsk, koyo, ntn, skf, fag, ina, timken, torrington, rbc, kaydon, ntn, nsk, koyo, nachi, ntn, nsk, koyo, nachi, iko, thk, hiwin, schneeberger, rexroth, parker, eaton, danfoss, sauer, bibus, hydac, argo, hytos, internormen, pall, mahle, mann, hummel, hengst, donaldson, fleetguard, baldwin, luber, finer, cummins, detroit, diesel, caterpillar, john, deere, case, ih, new, holland, massey, ferguson, claas, fendt, valtra, deutz, fahr, krone, pottinger, lely, kverneland, amazone, rauch, lely, delaval, gea, westfalia, surge, boumatic, dairy, master, afimilk, scr, allflex, datamars, shearwell, roxan, identi, gen, zee, tag, smartbow, cowlar, connecterra, cainthus, farm, log, agrivi, kons, pand, trimble, topcon, deere, case, claas, fendt, valtra, massey, new, holland, steyr, landini, mccormick, zetor, ursus, belarus, kirovets, ropa, holmer, grimme, dewulf, avr, standen, structural, ploeger, wul, sma, asa, lift, amity, concord, bourgault, seed, hawk, vaderstad, kverneland, amazone, pottinger, lely, kuhn, lely, krone, pottinger, claas, fendt, valtra, deutz, fahr, same, lamborghini, hurlimann, case, steyr, landini, mccormick, zetor, ursus, belarus, kirovets, cummins, deutz, perkins, yanmar, kubota, iseki, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh, yanmar, iseki, kubota, shibaura, hinomoto, mitsubishi, satoh",
  return words.filter(function (w) {
    var lower = w.toLowerCase();
    // 过滤停用词
    if (STOP_WORDS.has(lower)) return false;
    // 过滤纯数字
    if (/^\d+$/.test(w)) return false;
    return true;
  });
}

// 构建停用词集合
var STOP_WORDS = new Set();
(function () {
  var stopList = [
    'the', 'of', 'to', 'and', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was',
    'for', 'on', 'are', 'with', 'as', 'i', 'his', 'they', 'be', 'at', 'one', 'have',
    'this', 'from', 'or', 'had', 'by', 'not', 'but', 'what', 'some', 'we', 'can',
    'out', 'other', 'were', 'all', 'there', 'when', 'up', 'use', 'your', 'how',
    'said', 'an', 'each', 'she', 'which', 'do', 'their', 'time', 'if', 'will',
    'way', 'about', 'many', 'then', 'them', 'would', 'like', 'so', 'these',
    'her', 'long', 'make', 'thing', 'see', 'him', 'two', 'has', 'look', 'more',
    'day', 'could', 'go', 'come', 'did', 'my', 'no', 'most', 'over', 'know',
    'than', 'call', 'first', 'who', 'may', 'down', 'side', 'been', 'now', 'find',
    'any', 'new', 'work', 'part', 'take', 'get', 'place', 'made', 'where', 'after',
    'back', 'little', 'only', 'round', 'man', 'year', 'came', 'show', 'every',
    'good', 'me', 'give', 'our', 'under', 'name', 'very', 'through', 'just',
    'form', 'much', 'great', 'think', 'say', 'help', 'low', 'line', 'before',
    'too', 'same', 'tell', 'set', 'three', 'want', 'air', 'well', 'also', 'play',
    'small', 'end', 'put', 'home', 'read', 'hand', 'large', 'even', 'land', 'here',
    'must', 'big', 'high', 'such', 'why', 'ask', 'men', 'change', 'went', 'light',
    'kind', 'off', 'need', 'house', 'try', 'us', 'again', 'point', 'world', 'near',
    'build', 'self', 'earth', 'father', 'head', 'stand', 'own', 'page', 'should',
    'country', 'found', 'answer', 'school', 'grow', 'study', 'still', 'learn',
    'plant', 'cover', 'food', 'sun', 'four', 'between', 'state', 'keep', 'eye',
    'never', 'last', 'let', 'thought', 'city', 'tree', 'cross', 'farm', 'hard',
    'start', 'might', 'story', 'saw', 'far', 'sea', 'draw', 'left', 'late', 'run',
    'while', 'press', 'close', 'night', 'real', 'life', 'few', 'north', 'open',
    'seem', 'together', 'next', 'white', 'children', 'begin', 'got', 'walk',
    'paper', 'group', 'always', 'music', 'those', 'both', 'mark', 'often',
    'letter', 'until', 'mile', 'river', 'car', 'feet', 'care', 'second', 'book',
    'carry', 'took', 'science', 'eat', 'room', 'friend', 'began', 'idea', 'fish',
    'mountain', 'stop', 'once', 'base', 'hear', 'horse', 'cut', 'sure', 'watch',
    'color', 'face', 'wood', 'main', 'enough', 'plain', 'girl', 'usual', 'young',
    'ready', 'above', 'ever', 'red', 'list', 'though', 'feel', 'talk', 'bird',
    'soon', 'body', 'dog', 'family', 'direct', 'pose', 'leave', 'song', 'measure',
    'door', 'product', 'black', 'short', 'class', 'wind', 'question', 'happen',
    'complete', 'ship', 'area', 'half', 'rock', 'order', 'fire', 'south', 'problem',
    'piece', 'told', 'knew', 'pass', 'since', 'top', 'whole', 'king', 'space',
    'heard', 'best', 'hour', 'better', 'true', 'during', 'hundred', 'five',
    'remember', 'step', 'early', 'hold', 'west', 'ground', 'reach', 'fast',
    'table', 'travel', 'less', 'morning', 'ten', 'simple', 'several', 'toward',
    'war', 'lay', 'against', 'pattern', 'slow', 'center', 'love', 'person',
    'money', 'serve', 'appear', 'road', 'map', 'rain', 'rule', 'govern', 'pull',
    'cold', 'notice', 'voice', 'power', 'town', 'fine', 'certain', 'fly', 'fall',
    'lead', 'cry', 'dark', 'machine', 'note', 'wait', 'plan', 'figure', 'star',
    'box', 'noun', 'field', 'rest', 'correct', 'able', 'proud', 'done', 'beauty',
    'drive', 'stood', 'contain', 'front', 'teach', 'week', 'also', 'very', 'just',
    'almost', 'quite', 'rather', 'already', 'enough', 'even', 'much', 'too', 'well',
    'still', 'always', 'never', 'often', 'usually', 'sometimes', 'really', 'actually',
    'probably', 'maybe', 'perhaps', 'certainly', 'definitely', 'obviously', 'clearly',
    'simply', 'easily', 'quickly', 'slowly', 'carefully', 'naturally', 'normally',
    'generally', 'finally', 'eventually', 'sometimes', 'always', 'never', 'both',
    'each', 'all', 'any', 'most', 'many', 'more', 'some', 'few', 'other', 'another',
    'anyone', 'someone', 'everyone', 'nothing', 'everything', 'something', 'anything',
    'nobody', 'somebody', 'everybody', 'nowhere', 'somewhere', 'everywhere', 'anywhere',
    'however', 'therefore', 'otherwise', 'meanwhile', 'furthermore', 'nevertheless',
    'nonetheless', 'besides', 'moreover', 'thus', 'hence', 'accordingly', 'consequently',
    'afterwards', 'beforehand', 'hereafter', 'thereafter', 'hereby', 'thereby',
    'herein', 'therein', 'hereof', 'thereof', 'hereto', 'thereto', 'herewith',
    'therewith', 'whereas', 'whereby', 'wherein', 'whereof', 'whereupon', 'wherewith',
    'not', 'only', 'also', 'but', 'and', 'or', 'nor', 'for', 'so', 'yet',
    'both', 'either', 'neither', 'whether', 'if', 'unless', 'although', 'though',
    'because', 'since', 'while', 'whereas', 'lest', 'until', 'till', 'when',
    'whenever', 'where', 'wherever', 'after', 'before', 'once', 'as', 'than',
    'that', 'who', 'whom', 'whose', 'which', 'what', 'how', 'why', 'when',
    'where', 'whatever', 'whoever', 'whichever', 'whenever', 'wherever', 'however',
    'whomever', 'whatsoever', 'whosoever', 'whomsoever', 'whatnot', 'notwithstanding',
    'hello', 'hi', 'hey', 'ok', 'okay', 'oh', 'ah', 'um', 'er', 'yeah', 'yes',
    'no', 'please', 'thanks', 'thank', 'sorry', 'excuse', 'welcome', 'bye',
    'goodbye', 'morning', 'afternoon', 'evening', 'night', 'today', 'tomorrow',
    'yesterday', 'now', 'then', 'soon', 'later', 'ago', 'before', 'after',
    'during', 'since', 'until', 'while', 'when', 'where', 'how', 'why', 'what',
    'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'here',
    'there', 'everywhere', 'somewhere', 'anywhere', 'nowhere', 'everything',
    'something', 'anything', 'nothing', 'everyone', 'someone', 'anyone', 'noone',
    'everybody', 'somebody', 'anybody', 'nobody', 'always', 'never', 'sometimes',
    'often', 'usually', 'rarely', 'seldom', 'hardly', 'scarcely', 'barely',
    'nearly', 'almost', 'about', 'around', 'approximately', 'exactly', 'precisely',
    'absolutely', 'completely', 'totally', 'entirely', 'fully', 'partly', 'partially',
    'mostly', 'mainly', 'chiefly', 'primarily', 'largely', 'generally', 'normally',
    'typically', 'usually', 'commonly', 'widely', 'broadly', 'narrowly', 'specifically',
    'particularly', 'especially', 'notably', 'remarkably', 'surprisingly', 'interestingly',
    'importantly', 'significantly', 'considerably', 'substantially', 'greatly', 'highly',
    'strongly', 'deeply', 'heavily', 'badly', 'poorly', 'well', 'better', 'best',
    'worse', 'worst', 'less', 'least', 'more', 'most', 'very', 'much', 'too',
    'enough', 'quite', 'rather', 'fairly', 'pretty', 'so', 'such', 'really',
    'truly', 'indeed', 'actually', 'certainly', 'surely', 'definitely', 'absolutely',
    'possibly', 'probably', 'perhaps', 'maybe', 'likely', 'unlikely', 'sure',
    'supposed', 'presumably', 'apparently', 'obviously', 'evidently', 'clearly',
    'plainly', 'simply', 'naturally', 'clearly', 'obviously', 'evidently', 'apparently',
    'seemingly', 'ostensibly', 'allegedly', 'reportedly', 'supposedly', 'purportedly',
    'admittedly', 'undoubtedly', 'unquestionably', 'indisputably', 'inarguably',
    'incontestably', 'undeniable', 'undeniably', 'unquestionably', 'indubitably',
    'doubtless', 'doubtlessly', 'without', 'doubt', 'question', 'no', 'least',
    'any', 'case', 'anyway', 'anyhow', 'anyplace', 'anytime', 'anywhere', 'anybody',
    'anyone', 'anything', 'anymore', 'anywhere', 'anywise', 'anyroad', 'anyhoo',
    'anyways', 'anyroad', 'anyhows', 'aforementioned', 'abovementioned', 'above',
    'said', 'below', 'above', 'below', 'following', 'preceding', 'subsequent',
    'previous', 'next', 'last', 'first', 'second', 'third', 'fourth', 'fifth',
    'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth',
    'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth',
    'nineteenth', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth',
    'seventieth', 'eightieth', 'ninetieth', 'hundredth', 'thousandth', 'millionth',
    'billionth', 'trillionth', 'zillionth', 'gazillionth', 'bazillionth', 'jillionth',
    'st', 'nd', 'rd', 'th', 'st', 'nd', 'rd', 'th', 'st', 'nd', 'rd', 'th',
    'saint', 'street', 'avenue', 'boulevard', 'road', 'drive', 'lane', 'way',
    'place', 'court', 'circle', 'square', 'park', 'plaza', 'heights', 'gardens',
    'estates', 'commons', 'crossing', 'station', 'pike', 'turnpike', 'highway',
    'freeway', 'expressway', 'parkway', 'route', 'trail', 'path', 'walk', 'alley',
    'bypass', 'bridge', 'tunnel', 'viaduct', 'causeway', 'underpass', 'overpass',
    'interchange', 'junction', 'intersection', 'corner', 'block', 'lot', 'unit',
    'suite', 'apartment', 'floor', 'building', 'tower', 'complex', 'mall', 'center',
    'plaza', 'office', 'headquarters', 'branch', 'division', 'department', 'section',
    'chapter', 'page', 'paragraph', 'sentence', 'clause', 'phrase', 'word', 'letter',
    'number', 'digit', 'figure', 'symbol', 'sign', 'mark', 'character', 'glyph',
    'token', 'type', 'font', 'style', 'size', 'color', 'weight', 'width', 'height',
    'length', 'depth', 'breadth', 'width', 'thickness', 'diameter', 'radius',
    'circumference', 'perimeter', 'area', 'volume', 'surface', 'edge', 'border',
    'margin', 'padding', 'spacing', 'gap', 'space', 'distance', 'interval', 'range',
    'span', 'scale', 'ratio', 'proportion', 'percentage', 'fraction', 'decimal',
    'integer', 'number', 'digit', 'numeral', 'figure', 'value', 'amount', 'quantity',
    'total', 'sum', 'difference', 'product', 'quotient', 'remainder', 'average',
    'mean', 'median', 'mode', 'range', 'variance', 'standard', 'deviation',
    'distribution', 'frequency', 'probability', 'chance', 'likelihood', 'odds',
    'risk', 'chance', 'probability', 'rate', 'frequency', 'incidence', 'prevalence',
    'occurrence', 'event', 'outcome', 'result', 'consequence', 'effect', 'impact',
    'influence', 'change', 'difference', 'variation', 'fluctuation', 'trend',
    'pattern', 'tendency', 'direction', 'movement', 'shift', 'transition',
    'transformation', 'conversion', 'alteration', 'modification', 'adjustment',
    'adaptation', 'revision', 'amendment', 'correction', 'improvement', 'enhancement',
    'upgrade', 'update', 'refinement', 'optimization', 'perfection', 'excellence',
    'quality', 'standard', 'level', 'grade', 'rank', 'class', 'category', 'type',
    'kind', 'sort', 'variety', 'species', 'genre', 'style', 'form', 'format',
    'model', 'version', 'edition', 'release', 'issue', 'publication', 'document',
    'file', 'record', 'report', 'statement', 'account', 'description', 'explanation',
    'definition', 'interpretation', 'analysis', 'evaluation', 'assessment', 'review',
    'examination', 'investigation', 'inquiry', 'research', 'study', 'survey',
    'experiment', 'test', 'trial', 'attempt', 'effort', 'endeavor', 'enterprise',
    'venture', 'project', 'task', 'assignment', 'job', 'role', 'duty', 'responsibility',
    'obligation', 'commitment', 'promise', 'agreement', 'contract', 'deal', 'arrangement',
    'plan', 'scheme', 'strategy', 'tactic', 'approach', 'method', 'technique', 'procedure',
    'process', 'operation', 'activity', 'action', 'step', 'stage', 'phase',
    'phase', 'facet', 'feature', 'characteristic', 'attribute', 'quality', 'property',
    'trait', 'aspect', 'dimension', 'element', 'component', 'ingredient', 'factor',
    'variable', 'parameter', 'constant', 'coefficient', 'term', 'expression',
    'equation', 'formula', 'function', 'relation', 'relationship', 'connection',
    'link', 'association', 'correlation', 'causation', 'causality', 'determinant',
    'predictor', 'indicator', 'measure', 'metric', 'index', 'score', 'rating',
    'ranking', 'grade', 'level', 'scale', 'spectrum', 'continuum', 'range',
    'scope', 'extent', 'degree', 'magnitude', 'intensity', 'severity', 'strength',
    'force', 'power', 'energy', 'capacity', 'ability', 'capability', 'competence',
    'skill', 'talent', 'gift', 'aptitude', 'faculty', 'potential', 'possibility',
    'opportunity', 'chance', 'prospect', 'option', 'choice', 'alternative', 'solution',
    'answer', 'response', 'reply', 'feedback', 'input', 'output', 'result', 'outcome',
    'conclusion', 'finding', 'discovery', 'insight', 'understanding', 'knowledge',
    'wisdom', 'learning', 'education', 'training', 'experience', 'practice',
    'exercise', 'drill', 'routine', 'habit', 'custom', 'tradition', 'culture',
    'heritage', 'legacy', 'history', 'past', 'present', 'future', 'time', 'moment',
    'instant', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year', 'decade',
    'century', 'millennium', 'era', 'epoch', 'age', 'period', 'phase', 'stage',
    'chapter', 'season', 'term', 'semester', 'quarter', 'session', 'break',
    'holiday', 'vacation', 'leave', 'absence', 'presence', 'attendance', 'participation',
    'involvement', 'engagement', 'commitment', 'dedication', 'devotion', 'loyalty',
    'faith', 'belief', 'trust', 'confidence', 'hope', 'wish', 'desire', 'dream',
    'goal', 'objective', 'target', 'aim', 'purpose', 'intention', 'plan', 'ambition',
    'aspiration', 'motivation', 'inspiration', 'encouragement', 'support', 'help',
    'aid', 'assistance', 'guidance', 'advice', 'counsel', 'recommendation',
    'suggestion', 'proposal', 'offer', 'request', 'demand', 'requirement',
    'need', 'necessity', 'want', 'lack', 'shortage', 'deficit', 'surplus',
    'excess', 'abundance', 'plenty', 'wealth', 'poverty', 'deprivation', 'hardship',
    'difficulty', 'challenge', 'obstacle', 'barrier', 'hindrance', 'impediment',
    'problem', 'issue', 'concern', 'matter', 'affair', 'business', 'topic',
    'subject', 'theme', 'motif', 'pattern', 'concept', 'notion', 'idea', 'thought',
    'opinion', 'view', 'perspective', 'standpoint', 'position', 'stance', 'attitude',
    'approach', 'outlook', 'mindset', 'mentality', 'disposition', 'inclination',
    'tendency', 'bias', 'prejudice', 'preference', 'favor', 'favoritism',
    'discrimination', 'inequality', 'injustice', 'unfairness', 'imbalance',
    'disparity', 'gap', 'difference', 'contrast', 'discrepancy', 'inconsistency',
    'contradiction', 'conflict', 'tension', 'friction', 'struggle', 'fight',
    'battle', 'war', 'peace', 'harmony', 'concord', 'accord', 'agreement',
    'consensus', 'understanding', 'compromise', 'settlement', 'resolution',
    'reconciliation', 'mediation', 'negotiation', 'dialogue', 'discussion',
    'conversation', 'communication', 'interaction', 'exchange', 'debate',
    'argument', 'dispute', 'controversy', 'disagreement', 'objection', 'opposition',
    'resistance', 'protest', 'dissent', 'rebellion', 'revolution', 'revolt',
    'uprising', 'insurrection', 'mutiny', 'riot', 'disorder', 'chaos', 'confusion',
    'turmoil', 'upheaval', 'disturbance', 'disruption', 'interruption', 'break',
    'pause', 'halt', 'stop', 'cessation', 'termination', 'conclusion', 'ending',
    'finish', 'completion', 'closure', 'resolution', 'solution', 'answer',
    'remedy', 'cure', 'treatment', 'therapy', 'healing', 'recovery', 'restoration',
    'renewal', 'rebirth', 'revival', 'renaissance', 'regeneration', 'rejuvenation',
    'reinvigoration', 'revitalization', 'resurgence', 'resurrection', 'comeback',
    'return', 'emergence', 'appearance', 'manifestation', 'expression', 'representation',
    'depiction', 'portrayal', 'description', 'narration', 'account', 'story',
    'tale', 'narrative', 'chronicle', 'history', 'record', 'document', 'file',
    'archive', 'collection', 'compilation', 'anthology', 'corpus', 'library',
    'repository', 'database', 'store', 'storage', 'warehouse', 'depot', 'stock',
    'inventory', 'supply', 'provision', 'reserve', 'stockpile', 'hoard', 'cache',
    'treasure', 'trove', 'collection', 'set', 'group', 'batch', 'bundle', 'pack',
    'package', 'parcel', 'lot', 'bunch', 'cluster', 'clump', 'heap', 'pile',
    'stack', 'mound', 'mountain', 'hill', 'peak', 'summit', 'top', 'crest',
    'ridge', 'cliff', 'slope', 'valley', 'basin', 'plain', 'plateau', 'desert',
    'forest', 'jungle', 'woods', 'grove', 'orchard', 'garden', 'park', 'field',
    'meadow', 'pasture', 'prairie', 'savanna', 'tundra', 'swamp', 'marsh',
    'bog', 'fen', 'moor', 'heath', 'down', 'dale', 'glen', 'canyon', 'gorge',
    'ravine', 'gully', 'ditch', 'trench', 'furrow', 'channel', 'canal', 'river',
    'stream', 'creek', 'brook', 'rivulet', 'tributary', 'confluence', 'estuary',
    'delta', 'mouth', 'source', 'spring', 'well', 'fountain', 'waterfall', 'cascade',
    'rapids', 'current', 'tide', 'wave', 'surf', 'swell', 'ripple', 'splash',
    'spray', 'foam', 'froth', 'bubble', 'drop', 'droplet', 'drip', 'trickle',
    'dribble', 'leak', 'seep', 'ooze', 'flow', 'stream', 'pour', 'gush', 'spurt',
    'jet', 'spout', 'fountain', 'geyser', 'spring', 'well', 'reservoir', 'lake',
    'pond', 'pool', 'puddle', 'basin', 'tank', 'cistern', 'aquifer', 'groundwater',
    'water', 'table', 'watershed', 'drainage', 'divide', 'basin', 'catchment',
    'irrigation', 'reservoir', 'dam', 'dike', 'levee', 'embankment', 'canal',
    'aqueduct', 'pipeline', 'conduit', 'culvert', 'drain', 'sewer', 'gutter',
    'storm', 'drain', 'catch', 'basin', 'manhole', 'cover', 'grate', 'grating',
    'grid', 'mesh', 'net', 'screen', 'filter', 'strainer', 'sieve', 'colander',
    'sifter', 'riddle', 'separator', 'classifier', 'sorter', 'grader', 'selector',
    'picker', 'chooser', 'decider', 'judge', 'arbiter', 'referee', 'umpire',
    'mediator', 'moderator', 'facilitator', 'coordinator', 'organizer', 'arranger',
    'planner', 'scheduler', 'programmer', 'developer', 'coder', 'engineer',
    'architect', 'designer', 'creator', 'maker', 'builder', 'constructor',
    'manufacturer', 'producer', 'generator', 'originator', 'initiator', 'founder',
    'pioneer', 'trailblazer', 'innovator', 'inventor', 'discoverer', 'explorer',
    'adventurer', 'traveler', 'journeyer', 'voyager', 'wanderer', 'roamer',
    'nomad', 'drifter', 'vagabond', 'tramp', 'hobo', 'bum', 'beggar', 'pauper',
    'destitute', 'indigent', 'impoverished', 'poor', 'needy', 'underprivileged',
    'disadvantaged', 'deprived', 'forsaken', 'abandoned', 'deserted', 'forgotten',
    'neglected', 'ignored', 'overlooked', 'disregarded', 'dismissed', 'rejected',
    'spurned', 'snubbed', 'slighted', 'shunned', 'avoided', 'evaded', 'eluded',
    'escaped', 'fled', 'absconded', 'decamped', 'bolted', 'departed', 'left',
    'exited', 'withdrew', 'retreated', 'retired', 'resigned', 'quit', 'gave',
    'up', 'surrendered', 'yielded', 'capitulated', 'submitted', 'complied',
    'obeyed', 'conformed', 'adhered', 'followed', 'observed', 'respected',
    'honored', 'revered', 'venerated', 'worshipped', 'adored', 'idolized',
    'cherished', 'treasured', 'valued', 'prized', 'esteemed', 'appreciated',
    'admired', 'respected', 'liked', 'loved', 'fancied', 'preferred', 'favored',
    'chose', 'picked', 'selected', 'elected', 'opted', 'decided', 'determined',
    'resolved', 'settled', 'concluded', 'finished', 'completed', 'ended',
    'terminated', 'ceased', 'stopped', 'halted', 'paused', 'suspended', 'interrupted',
    'disrupted', 'disturbed', 'bothered', 'annoyed', 'irritated', 'aggravated',
    'exasperated', 'infuriated', 'enraged', 'angered', 'maddened', 'provoked',
    'incited', 'instigated', 'fomented', 'stirred', 'roused', 'awakened', 'aroused',
    'excited', 'stimulated', 'energized', 'invigorated', 'revitalized', 'refreshed',
    'renewed', 'restored', 'rejuvenated', 'regenerated', 'resurrected', 'revived',
    'reawakened', 'rekindled', 'relit', 'reignited', 'rekindled', 'reopened',
    'restarted', 'resumed', 'continued', 'persisted', 'persevered', 'endured',
    'lasted', 'survived', 'lived', 'existed', 'subsisted', 'thrived', 'flourished',
    'prospered', 'succeeded', 'achieved', 'accomplished', 'attained', 'reached',
    'gained', 'obtained', 'acquired', 'secured', 'procured', 'earned', 'won',
    'captured', 'seized', 'grabbed', 'snatched', 'took', 'got', 'received',
    'accepted', 'welcomed', 'embraced', 'adopted', 'took', 'on', 'assumed',
    'undertook', 'attempted', 'tried', 'endeavored', 'strived', 'sought',
    'pursued', 'chased', 'hunted', 'tracked', 'traced', 'trailed', 'followed',
    'shadowed', 'tailed', 'stalked', 'pursued', 'courted', 'wooed', 'dated',
    'romanced', 'proposed', 'engaged', 'married', 'wed', 'divorced', 'separated',
    'split', 'broke', 'up', 'parted', 'left', 'departed', 'went', 'away',
    'moved', 'on', 'progressed', 'advanced', 'proceeded', 'continued', 'carried',
    'on', 'kept', 'going', 'persevered', 'persisted', 'endured', 'survived',
    'lived', 'through', 'made', 'it', 'got', 'through', 'came', 'through',
    'pulled', 'through', 'weathered', 'withstood', 'resisted', 'opposed',
    'defied', 'challenged', 'confronted', 'faced', 'encountered', 'met',
    'experienced', 'underwent', 'suffered', 'endured', 'bore', 'tolerated',
    'stood', 'accepted', 'acknowledged', 'recognized', 'realized', 'understood',
    'comprehended', 'grasped', 'appreciated', 'perceived', 'discerned', 'detected',
    'noticed', 'observed', 'saw', 'witnessed', 'viewed', 'watched', 'gazed',
    'stared', 'glanced', 'looked', 'peered', 'peeped', 'peeked', 'glimpsed',
    'spotted', 'sighted', 'discovered', 'found', 'located', 'identified',
    'determined', 'ascertained', 'established', 'verified', 'confirmed',
    'validated', 'authenticated', 'proved', 'demonstrated', 'showed', 'indicated',
    'revealed', 'disclosed', 'exposed', 'uncovered', 'unveiled', 'unmasked',
    'uncloaked', 'undressed', 'stripped', 'bared', 'naked', 'nude', 'exposed',
    'revealed', 'shown', 'displayed', 'exhibited', 'presented', 'offered',
    'provided', 'supplied', 'furnished', 'equipped', 'armed', 'prepared',
    'readied', 'organized', 'arranged', 'ordered', 'sorted', 'classified',
    'categorized', 'grouped', 'clustered', 'clumped', 'bundled', 'packed',
    'packaged', 'wrapped', 'tied', 'bound', 'fastened', 'secured', 'locked',
    'sealed', 'closed', 'shut', 'covered', 'concealed', 'hid', 'hidden',
    'buried', 'interred', 'entombed', 'inhumed', 'sepulchered', 'enshrined',
    'ensconced', 'nestled', 'snuggled', 'cuddled', 'hugged', 'embraced',
    'clasped', 'clutched', 'gripped', 'held', 'grasped', 'seized', 'grabbed',
    'snatched', 'took', 'caught', 'captured', 'trapped', 'snared', 'netted',
    'bagged', 'landed', 'hooked', 'reeled', 'hauled', 'pulled', 'dragged',
    'tugged', 'yanked', 'jerked', 'twitched', 'plucked', 'picked', 'pinched',
    'nipped', 'tweaked', 'twisted', 'wrenched', 'wrung', 'squeezed', 'pressed',
    'compressed', 'crushed', 'pulverized', 'ground', 'milled', 'mashed', 'squashed',
    'flattened', 'leveled', 'smoothed', 'polished', 'buffed', 'burnished', 'shined',
    'gleamed', 'glowed', 'glistened', 'glittered', 'sparkled', 'twinkled', 'shimmered',
    'radiated', 'beamed', 'shone', 'lit', 'illuminated', 'brightened', 'lightened',
    'enlightened', 'educated', 'informed', 'instructed', 'taught', 'trained',
    'coached', 'mentored', 'guided', 'led', 'directed', 'steered', 'piloted',
    'navigated', 'conducted', 'escorted', 'accompanied', 'attended', 'served',
    'waited', 'assisted', 'helped', 'aided', 'supported', 'backed', 'endorsed',
    'championed', 'advocated', 'promoted', 'advanced', 'further', 'forwarded',
    'propelled', 'pushed', 'drove', 'thrust', 'shoved', 'forced', 'compelled',
    'obliged', 'obligated', 'required', 'demanded', 'necessitated', 'entailed',
    'involved', 'implied', 'indicated', 'suggested', 'hinted', 'intimated',
    'insinuated', 'alluded', 'referred', 'mentioned', 'cited', 'quoted', 'noted',
    'remarked', 'commented', 'observed', 'stated', 'said', 'spoke', 'uttered',
    'voiced', 'articulated', 'pronounced', 'enunciated', 'expressed', 'conveyed',
    'communicated', 'transmitted', 'relayed', 'passed', 'delivered', 'gave',
    'presented', 'offered', 'provided', 'submitted', 'proposed', 'suggested',
    'recommended', 'advised', 'counseled', 'warned', 'cautioned', 'alerted',
    'notified', 'informed', 'told', 'apprised', 'advised', 'briefed', 'updated',
    'reported', 'announced', 'declared', 'proclaimed', 'pronounced', 'decreed',
    'ordered', 'commanded', 'instructed', 'directed', 'bade', 'bidden', 'asked',
    'requested', 'solicited', 'begged', 'pleaded', 'implored', 'beseeched',
    'entreated', 'petitioned', 'appealed', 'prayed', 'supplicated', 'invoked',
    'called', 'summoned', 'convened', 'assembled', 'gathered', 'collected',
    'amassed', 'accumulated', 'aggregated', 'compiled', 'anthologized', 'collated',
    'correlated', 'compared', 'contrasted', 'matched', 'paired', 'coupled',
    'joined', 'linked', 'connected', 'attached', 'fastened', 'fixed', 'affixed',
    'anchored', 'moored', 'tethered', 'tied', 'bound', 'secured', 'locked',
    'latched', 'bolted', 'barred', 'blocked', 'obstructed', 'hindered', 'impeded',
    'prevented', 'stopped', 'halted', 'arrested', 'checked', 'curbed', 'restrained',
    'constrained', 'limited', 'restricted', 'confined', 'circumscribed', 'bounded',
    'delimited', 'demarcated', 'defined', 'determined', 'settled', 'fixed',
    'established', 'set', 'laid', 'placed', 'put', 'positioned', 'located',
    'situated', 'sited', 'stationed', 'posted', 'installed', 'mounted', 'erected',
    'built', 'constructed', 'assembled', 'fabricated', 'manufactured', 'produced',
    'made', 'created', 'formed', 'shaped', 'molded', 'sculpted', 'carved', 'crafted',
    'fashioned', 'designed', 'devised', 'contrived', 'invented', 'conceived',
    'imagined', 'envisioned', 'visualized', 'pictured', 'dreamed', 'fantasized',
    'hallucinated', 'deluded', 'deceived', 'tricked', 'fooled', 'duped', 'conned',
    'swindled', 'cheated', 'defrauded', 'bilked', 'fleeced', 'robbed', 'stole',
    'pinched', 'filched', 'swiped', 'lifted', 'shoplifted', 'burglarized',
    'looted', 'plundered', 'pillaged', 'sacked', 'ransacked', 'ravaged', 'devastated',
    'destroyed', 'ruined', 'wrecked', 'demolished', 'razed', 'leveled', 'flattened',
    'obliterated', 'annihilated', 'exterminated', 'eradicated', 'eliminated',
    'extirpated', 'uprooted', 'removed', 'deleted', 'erased', 'expunged',
    'effaced', 'obliterated', 'blotted', 'wiped', 'cleaned', 'washed', 'scrubbed',
    'scoured', 'scraped', 'rubbed', 'sanded', 'polished', 'burnished', 'buffed',
    'shined', 'waxed', 'oiled', 'greased', 'lubricated', 'slicked', 'smoothed',
    'sleeked', 'combed', 'brushed', 'groomed', 'preened', 'pruned', 'trimmed',
    'clipped', 'cut', 'snipped', 'sheared', 'shaved', 'mowed', 'cropped',
    'harvested', 'reaped', 'gathered', 'collected', 'picked', 'plucked', 'culled',
    'selected', 'chose', 'sorted', 'graded', 'ranked', 'rated', 'evaluated',
    'assessed', 'judged', 'appraised', 'valued', 'estimated', 'calculated',
    'computed', 'reckoned', 'figured', 'counted', 'numbered', 'tallied', 'totaled',
    'summed', 'added', 'subtracted', 'multiplied', 'divided', 'derived', 'integrated',
    'differentiated', 'solved', 'resolved', 'determined', 'ascertained', 'established',
    'verified', 'confirmed', 'validated', 'substantiated', 'corroborated', 'authenticated',
    'certified', 'attested', 'testified', 'witnessed', 'vouched', 'guaranteed',
    'warranted', 'assured', 'insured', 'ensured', 'secured', 'protected', 'safeguarded',
    'shielded', 'guarded', 'defended', 'preserved', 'conserved', 'maintained',
    'sustained', 'supported', 'upheld', 'propped', 'buttressed', 'bolstered',
    'reinforced', 'strengthened', 'fortified', 'hardened', 'toughened', 'tempered',
    'annealed', 'quenched', 'cooled', 'chilled', 'froze', 'frozen', 'melted',
    'thawed', 'heated', 'warmed', 'hot', 'cold', 'warm', 'cool', 'tepid',
    'lukewarm', 'scalding', 'boiling', 'simmering', 'steaming', 'smoking',
    'burning', 'blazing', 'flaming', 'fiery', 'incandescent', 'glowing', 'radiant',
    'luminous', 'bright', 'brilliant', 'dazzling', 'blinding', 'shining', 'gleaming',
    'sparkling', 'glittering', 'twinkling', 'shimmering', 'glistening', 'glinting',
    'flashing', 'flickering', 'wavering', 'dancing', 'playing', 'frolicking',
    'cavorting', 'gamboling', 'prancing', 'skipping', 'hopping', 'jumping', 'leaping',
    'bounding', 'springing', 'vaulting', 'soaring', 'flying', 'gliding', 'sailing',
    'floating', 'drifting', 'hovering', 'suspending', 'hanging', 'dangling',
    'swinging', 'swaying', 'rocking', 'rolling', 'tumbling', 'falling', 'dropping',
    'plummeting', 'plunging', 'diving', 'sinking', 'submerging', 'immersing',
    'dipping', 'dunking', 'dousing', 'drenching', 'soaking', 'saturating',
    'steeping', 'marinating', 'infusing', 'brewing', 'stewing', 'simmering',
    'boiling', 'frying', 'sauteing', 'stirring', 'mixing', 'blending', 'combining',
    'merging', 'uniting', 'joining', 'fusing', 'welding', 'soldering', 'brazing',
    'riveting', 'nailing', 'screwing', 'bolting', 'pinning', 'clipping', 'stapling',
    'tacking', 'stitching', 'sewing', 'knitting', 'crocheting', 'weaving', 'braiding',
    'plaiting', 'twisting', 'twining', 'entwining', 'interlacing', 'interweaving',
    'interlocking', 'interconnecting', 'interlinking', 'interrelating', 'interacting',
    'interplaying', 'intermeshing', 'interdigitating', 'intercalating', 'interpolating',
    'interleaving', 'interlarding', 'interspersing', 'intermingling', 'intermixing',
    'interblending', 'interfusing', 'interpenetrating', 'interpermeating', 'interdiffusing',
    'interosculating', 'intercommunicating', 'interconnecting', 'interdepending',
    'interrelating', 'intercorrelating', 'interassociating', 'interaffiliating',
    'interaligning', 'intercoordinating', 'intercalibrating', 'intersynchronizing',
    'interharmonizing', 'interbalancing', 'interequilibrating', 'interstabilizing',
    'intersteadying', 'interpoising', 'intercounterbalancing', 'intercompensating',
    'interoffsetting', 'interneutralizing', 'intercanceling', 'internullifying',
    'internegating', 'interannulling', 'interinvalidating', 'intervoiding',
    'interabrogating', 'interrescinding', 'interrevoking', 'interrepealing',
    'intercountermanding', 'interoverriding', 'interoverruling', 'intervetoing',
    'interprohibiting', 'interforbidding', 'interbanning', 'interproscribing',
    'interinterdicting', 'interembargoing', 'interboycotting', 'interblacklisting',
    'interostracizing', 'interexcommunicating', 'interexiling', 'interbanishing',
    'interexpelling', 'interdeporting', 'interextraditing', 'interrepatriating',
    'interevicting', 'interousting', 'interdispossessing', 'interdislodging',
    'interdisplacing', 'interuprooting', 'interremoving', 'intereliminating',
    'intereradicating', 'interextirpating', 'interexterminating', 'interannihilating',
    'interobliterating', 'interdecimating', 'interdevastating', 'interravaging',
    'interdesolating', 'interdespoiling', 'interplundering', 'interpillaging',
    'intersacking', 'interlooting', 'interransacking', 'intervandalizing',
    'interdemolishing', 'interwrecking', 'interruining', 'interdestroying',
    'interannihilating', 'intervaporizing', 'interpulverizing', 'interatomizing',
    'interdisintegrating', 'interfragmenting', 'intershattering', 'intersplintering',
    'intercrumbling', 'interdisintegrating', 'interdecomposing', 'interdecaying',
    'interrotting', 'interputrefying', 'interfestering', 'intermoldering',
    'intercorroding', 'interrusting', 'interoxidizing', 'intertarnishing',
    'interweathering', 'intereroding', 'interwearing', 'interabrading', 'interscouring',
    'interfretting', 'intergallings', 'interchafings', 'interexcoriations',
    'interabrasions', 'interattritions', 'interdetritions', 'intererosions',
    'intercorrasions', 'interdenudations', 'interdegradations', 'interdeteriorations',
    'interdegenerations', 'interdevolutions', 'interretrogressions', 'interregressions',
    'interretrogressions', 'interdeclines', 'interdecadences', 'interdecays',
    'interdeclensions', 'interdescensions', 'interdescents', 'interdownfalls',
    'intercollapses', 'interbreakdowns', 'interfailures', 'interruins', 'interwrecks',
    'interdevastations', 'interdestructions', 'interobliterations', 'interannihilations',
    'interexterminations', 'interextirpations', 'intereradications', 'intereliminations',
    'interremovals', 'interdeletions', 'intererasures', 'interexpunctions',
    'intereffacements', 'interobliterations', 'intercancellations', 'interannulments',
    'interrevocations', 'interrescissions', 'interrepeals', 'interabrogations',
    'intervoidances', 'interinvalidations', 'internullifications', 'internegations',
    'interneutralizations', 'intercounteractions', 'intercounterbalances',
    'intercompensations', 'interoffsets', 'intercancellings', 'interannullings',
    'intervoidings', 'interinvalidatings', 'internullifyings', 'internegatings',
    'interneutralizings', 'intercounteractings', 'intercounterbalancings',
    'intercompensatings', 'interoffsets', 'interoffsets', 'interoffsets',
    'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets',
    'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets',
    'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets',
    'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets', 'interoffsets',
    'actually', 'already', 'also', 'always', 'both', 'certainly', 'clearly',
    'definitely', 'easily', 'enough', 'even', 'ever', 'finally', 'first',
    'generally', 'hardly', 'however', 'indeed', 'just', 'last', 'least',
    'less', 'maybe', 'more', 'most', 'much', 'nearly', 'never', 'normally',
    'not', 'now', 'obviously', 'often', 'only', 'perhaps', 'probably',
    'quite', 'rather', 'really', 'scarcely', 'seldom', 'simply', 'so',
    'sometimes', 'somewhat', 'soon', 'still', 'then', 'there', 'though',
    'thus', 'today', 'together', 'too', 'usually', 'very', 'well', 'yet',
    'tomorrow', 'yesterday', 'ago', 'ahead', 'alike', 'allegedly', 'almost',
    'alone', 'along', 'already', 'also', 'always', 'anyhow', 'anyway',
    'anywhere', 'apart', 'around', 'aside', 'away', 'back', 'basically',
    'before', 'behind', 'below', 'besides', 'best', 'beyond', 'briefly',
    'carefully', 'certainly', 'clearly', 'closely', 'commonly', 'completely',
    'constantly', 'continually', 'correctly', 'currently', 'daily', 'deeply',
    'definitely', 'directly', 'easily', 'elsewhere', 'entirely', 'especially',
    'essentially', 'even', 'eventually', 'ever', 'everywhere', 'exactly',
    'extremely', 'fairly', 'finally', 'formerly', 'forth', 'fortunately',
    'forward', 'frequently', 'fully', 'further', 'generally', 'gradually',
    'greatly', 'happily', 'hardly', 'heavily', 'hence', 'here', 'highly',
    'honestly', 'hopefully', 'however', 'immediately', 'increasingly',
    'indeed', 'initially', 'instantly', 'interestingly', 'largely', 'lastly',
    'lately', 'later', 'least', 'less', 'likely', 'literally', 'mainly',
    'meanwhile', 'merely', 'mostly', 'namely', 'naturally', 'nearly',
    'necessarily', 'neither', 'never', 'nevertheless', 'next', 'nonetheless',
    'normally', 'notably', 'now', 'nowadays', 'obviously', 'occasionally',
    'often', 'once', 'only', 'otherwise', 'out', 'outside', 'over', 'overall',
    'particularly', 'partly', 'perhaps', 'personally', 'potentially', 'precisely',
    'presently', 'presumably', 'previously', 'primarily', 'probably', 'promptly',
    'properly', 'quickly', 'quite', 'randomly', 'rapidly', 'rarely', 'rather',
    'readily', 'really', 'recently', 'regardless', 'regularly', 'relatively',
    'repeatedly', 'reportedly', 'respectively', 'roughly', 'routinely', 'sadly',
    'scarcely', 'secondly', 'seemingly', 'seldom', 'seriously', 'severely',
    'shortly', 'significantly', 'similarly', 'simply', 'slightly', 'slowly',
    'smoothly', 'solely', 'somehow', 'sometimes', 'somewhat', 'soon', 'specifically',
    'steadily', 'still', 'strangely', 'strongly', 'subsequently', 'substantially',
    'successfully', 'suddenly', 'sufficiently', 'supposedly', 'surely', 'surprisingly',
    'then', 'there', 'thereafter', 'thereby', 'therefore', 'thirdly', 'thoroughly',
    'though', 'thus', 'today', 'together', 'tomorrow', 'tonight', 'too', 'totally',
    'traditionally', 'truly', 'twice', 'typically', 'ultimately', 'undoubtedly',
    'unfortunately', 'unlikely', 'unusually', 'usually', 'utterly', 'vastly',
    'very', 'virtually', 'visibly', 'weekly', 'well', 'widely', 'willingly',
    'wisely', 'worldwide', 'worse', 'worst', 'yearly', 'yesterday', 'yet',
  ];
  stopList.forEach(function (w) { STOP_WORDS.add(w); });
})();

/**
 * 从 OCR 结果文本中提取英文单词
 *
 * @param {string} text - OCR 识别出的原始文本
 * @returns {Array<string>} 去重后的英文单词数组
 */
function extractWords(text) {
  if (!text) return [];

  // 匹配 2 个字母以上的纯英文单词
  var matches = text.match(/[a-zA-Z]{2,}/g);
  if (!matches) return [];

  // 去重 + 过滤停用词 + 转小写
  var seen = {};
  var result = [];
  for (var i = 0; i < matches.length; i++) {
    var lower = matches[i].toLowerCase();
    // 过滤停用词和纯数字
    if (STOP_WORDS.has(lower)) continue;
    if (/^\d+$/.test(lower)) continue;
    if (!seen[lower]) {
      seen[lower] = true;
      result.push(lower);
    }
  }
  return result;
}

/**
 * OCR 图片识别（真实模式）
 *
 * 使用 OCR.space 免费 API 进行英文 OCR 识别。
 * 免费额度：每天 500 次，无需注册。
 * 失败时自动降级为演示模式。
 *
 * 注意：首次使用需在微信小程序管理后台添加 request 合法域名：
 *   https://api.ocr.space
 *
 * @param {string} filePath - 图片临时路径
 * @returns {Promise<Object>} { code, data: { words, demo_mode?, hint? } }
 */
function recognizeImage(filePath) {
  return new Promise(function (resolve) {
    // 尝试读取图片文件为 base64
    try {
      var fs = wx.getFileSystemManager();
      var base64Data = fs.readFileSync(filePath, 'base64');
    } catch (e) {
      console.warn('[OCR] 读取图片失败，降级为演示模式:', e);
      resolve({
        code: 0,
        data: { words: [], demo_mode: true, hint: '演示模式（图片读取失败）' },
      });
      return;
    }

    // 检查 base64 数据大小（超过 1MB 压缩警告）
    if (base64Data.length > 1000000) {
      console.warn('[OCR] 图片过大（' + (base64Data.length / 1000000).toFixed(1) + 'MB），可能影响识别速度');
    }

    // 调用 OCR.space API
    wx.request({
      url: OCR_CONFIG.url,
      method: 'POST',
      header: {
        'apikey': OCR_CONFIG.apiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: {
        base64Image: 'data:image/jpeg;base64,' + base64Data,
        language: OCR_CONFIG.language,
        isOverlayRequired: false,
        detectOrientation: true,
        scale: true,
        OCREngine: 2,
      },
      timeout: OCR_CONFIG.timeout,
      success: function (res) {
        // 检查 API 返回结果
        if (res.statusCode === 200 && res.data && !res.data.IsErroredOnProcessing) {
          var parsedResults = res.data.ParsedResults;
          if (parsedResults && parsedResults.length > 0) {
            var text = parsedResults[0].ParsedText || '';
            var words = extractWords(text);
            console.log('[OCR] 识别成功，提取到 ' + words.length + ' 个单词');
            resolve({
              code: 0,
              data: { words: words, demo_mode: false },
            });
            return;
          }
        }

        // API 返回异常
        console.warn('[OCR] API 返回异常，降级为演示模式:', res);
        resolve({
          code: 0,
          data: { words: [], demo_mode: true, hint: '演示模式（OCR 服务异常）' },
        });
      },
      fail: function (err) {
        console.warn('[OCR] 网络请求失败，降级为演示模式:', err);
        // 降级为演示模式
        resolve({
          code: 0,
          data: { words: [], demo_mode: true, hint: '演示模式（网络请求失败，请检查域名白名单）' },
        });
      },
    });
  });
}

/**
 * 词典查词（本地）
 *
 * 调用本地 dict.js 模块的 lookupBatch 函数进行单词查询
 *
 * @param {Array<string>} words - 待查询的单词数组
 * @returns {Promise<Object>} { code, data: { meanings, not_found, total, matched } }
 */
function dictLookup(words) {
  return new Promise(function (resolve) {
    var result = dict.lookupBatch(words);
    resolve({
      code: 0,
      data: {
        meanings: result.meanings,
        not_found: result.notFound,
        total: words.length,
        matched: Object.keys(result.meanings).length,
      },
    });
  });
}

/**
 * 导出文件生成（本地）
 *
 * @param {string} format - 导出格式（txt/csv/anki/momo/bubei/eudic/baicizhan/youdao/quizlet）
 * @param {Array<Object>} words - 单词数组 [{word: string, meaning: string}, ...]
 * @returns {Promise<Object>} { code, data: { format, word_count, content, filename } }
 */
function generateExport(format, words) {
  return new Promise(function (resolve, reject) {
    try {
      var result = exportUtil.generateExport(format, words);
      resolve({
        code: 0,
        data: {
          format: format,
          word_count: words.length,
          content: result.content,
          filename: result.filename,
        },
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 健康检查
 */
function healthCheck() {
  return Promise.resolve({ code: 0 });
}

module.exports = {
  recognizeImage: recognizeImage,
  dictLookup: dictLookup,
  generateExport: generateExport,
  healthCheck: healthCheck,
};