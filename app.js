(function () {
  var KEY = "k45-ambassador-toolkit-v1";
  var data = window.TOOLKIT;
  var main = document.getElementById("main");
  var state = load();
  var lastRoute = "";

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      return {
        completed: Array.isArray(saved.completed) ? saved.completed : [],
        prep: saved.prep && typeof saved.prep === "object" ? saved.prep : {},
        answers: saved.answers && typeof saved.answers === "object" ? saved.answers : {},
      };
    } catch (err) {
      return { completed: [], prep: {}, answers: {} };
    }
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function fa(n) {
    return String(n).replace(/\d/g, function (d) {
      return "۰۱۲۳۴۵۶۷۸۹"[d];
    });
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else if (key === "html") node.innerHTML = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function route() {
    var hash = location.hash || "#/";
    var parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    if (parts[0] === "stage" && parts[1]) return { name: "stage", id: Number(parts[1]) };
    if (parts[0] === "path") return { name: "path" };
    if (parts[0] === "standard") return { name: "standard" };
    if (parts[0] === "ready") return { name: "ready" };
    return { name: "home" };
  }

  function moduleById(id) {
    return data.modules.filter(function (m) { return m.id === id; })[0];
  }

  function isDone(id) {
    return state.completed.indexOf(id) !== -1;
  }

  function isUnlocked(id) {
    return id === 1 || isDone(id - 1);
  }

  function requiredFields() {
    return data.prepFields.filter(function (field) { return field.required; });
  }

  function missingRequired() {
    return requiredFields().filter(function (field) {
      return !String(state.prep[field.id] || "").trim();
    });
  }

  function prepReady() {
    return missingRequired().length === 0;
  }

  function markDone(id) {
    if (!isDone(id)) state.completed.push(id);
    save();
  }

  function setNav(name) {
    document.querySelectorAll(".nav a").forEach(function (link) {
      var key = link.getAttribute("data-nav");
      var current = (name === "stage" && key === "path") || key === name;
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.body.dataset.view = name === "stage" ? "path" : name;
  }

  function render() {
    var current = route();
    var focus = location.hash !== lastRoute;
    lastRoute = location.hash;
    setNav(current.name);
    main.replaceChildren();
    if (current.name === "path") renderPath();
    else if (current.name === "stage") renderStage(current.id);
    else if (current.name === "standard") renderStandard();
    else if (current.name === "ready") renderReady();
    else renderHome();
    if (focus) {
      var heading = main.querySelector("h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }
  }

  function renderHome() {
    var done = state.completed.length;
    var pathStatus = done === 0
      ? "هشت مرحله، هر کدام با یک درس کوتاه و یک تمرین."
      : done === 8
        ? "هر هشت مرحله بسته شده است."
        : fa(done) + " از ۸ مرحله بسته شده.";
    var readyStatus = prepReady()
      ? "چهار فیلد الزامی برگه پر شده است."
      : "برگه شخصی را قبل از حضور پر کنید.";

    main.appendChild(el("p", { class: "kicker", text: data.home.kicker }));
    main.appendChild(el("h1", { text: data.title }));
    main.appendChild(el("p", { class: "lead", text: data.home.lead }));
    main.appendChild(el("p", { text: data.home.role }));
    main.appendChild(el("p", { class: "muted", text: data.edition }));

    var grid = el("div", { class: "home-grid" });
    grid.appendChild(card("01", "مسیر یادگیری", pathStatus, "#/path"));
    grid.appendChild(card("02", "استاندارد", "قاعده‌های مصوب، آماده چاپ روی یک صفحه.", "#/standard"));
    grid.appendChild(card("03", "آمادگی", readyStatus, "#/ready"));
    main.appendChild(grid);
  }

  function card(index, title, text, href) {
    return el("a", { class: "card", href: href }, [
      el("span", { class: "card-index", text: index }),
      el("strong", { text: title }),
      el("p", { text: text }),
    ]);
  }

  function renderPath() {
    main.appendChild(el("p", { class: "kicker", text: "مسیر یادگیری" }));
    main.appendChild(el("h1", { text: "هشت مرحله تا آمادگی" }));
    main.appendChild(el("p", { text: "مرحله بعد وقتی باز می‌شود که تمرین همین مرحله را پاس کنید. پیشرفت روی همین مرورگر می‌ماند." }));
    var bar = el("div", { class: "progress", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "8", "aria-valuenow": String(state.completed.length) });
    bar.appendChild(el("span", { style: "width:" + (state.completed.length / 8 * 100) + "%" }));
    main.appendChild(bar);

    var list = el("div", { class: "path-list" });
    data.modules.forEach(function (mod) {
      var done = isDone(mod.id);
      var unlocked = isUnlocked(mod.id);
      var status = done ? "بسته‌شده" : unlocked ? "باز" : "قفل";
      var body = [
        el("span", { class: "big", text: fa(mod.id) }),
        el("strong", { text: mod.title }),
        el("span", { class: "status muted", text: status }),
      ];
      if (unlocked) {
        list.appendChild(el("a", { class: "path-item" + (done ? " done" : ""), href: "#/stage/" + mod.id }, body));
      } else {
        var item = el("div", { class: "path-item locked" }, body);
        item.setAttribute("aria-disabled", "true");
        list.appendChild(item);
      }
    });
    main.appendChild(list);

    if (state.completed.length === 8) {
      var doneBox = el("div", { class: "banner ok" });
      doneBox.appendChild(el("strong", { text: "مسیر کامل است. " }));
      doneBox.appendChild(document.createTextNode("استاندارد را دم دست داشته باشید و برای هر حضور، برگه آمادگی را تازه کنید."));
      var actions = el("div", { class: "actions" });
      actions.appendChild(el("a", { class: "button", href: "#/standard", text: "دیدن استاندارد" }));
      actions.appendChild(el("a", { class: "button ghost", href: "#/ready", text: "برگه آمادگی" }));
      doneBox.appendChild(actions);
      main.appendChild(doneBox);
    }
  }

  function rail(activeId) {
    var aside = el("aside", { class: "rail no-print" });
    var list = el("ol");
    data.modules.forEach(function (mod) {
      var label = el("span", { text: mod.title });
      var num = el("span", { class: "num", text: fa(mod.id) });
      var li = el("li");
      if (isUnlocked(mod.id)) {
        var link = el("a", { href: "#/stage/" + mod.id, class: isDone(mod.id) ? "done" : "" }, [num, label]);
        if (mod.id === activeId) link.setAttribute("aria-current", "true");
        li.appendChild(link);
      } else {
        li.appendChild(el("span", { class: "locked" }, [num, label]));
      }
      list.appendChild(li);
    });
    aside.appendChild(list);
    return aside;
  }

  function renderBlocks(parent, blocks) {
    blocks.forEach(function (block) {
      if (block.type === "p") parent.appendChild(el("p", { text: block.text }));
      else if (block.type === "h") parent.appendChild(el("h2", { text: block.text }));
      else if (block.type === "note") parent.appendChild(el("div", { class: "note", text: block.text }));
      else if (block.type === "quote") parent.appendChild(el("blockquote", { text: block.text }));
      else if (block.type === "ul" || block.type === "ol") {
        var list = el(block.type, { class: "clean" });
        block.items.forEach(function (item) { list.appendChild(el("li", { text: item })); });
        parent.appendChild(list);
      } else if (block.type === "defs") {
        var defs = el("dl", { class: "defs" });
        block.items.forEach(function (item) {
          var wrap = el("div");
          wrap.appendChild(el("dt", { text: item.term }));
          wrap.appendChild(el("dd", { text: item.def }));
          defs.appendChild(wrap);
        });
        parent.appendChild(defs);
      } else if (block.type === "qa") {
        var stack = el("div", { class: "qa" });
        block.items.forEach(function (item) {
          var card = el("article");
          card.appendChild(el("h3", { text: item.q }));
          card.appendChild(el("p", { text: item.a }));
          stack.appendChild(card);
        });
        parent.appendChild(stack);
      } else if (block.type === "compare") {
        var cmp = el("div", { class: "compare" });
        block.items.forEach(function (item) {
          var card = el("article");
          var bad = el("p", { class: "bad" });
          bad.appendChild(el("strong", { text: "به‌جای: " }));
          bad.appendChild(document.createTextNode(item.bad));
          var good = el("p", { class: "good" });
          good.appendChild(el("strong", { text: "بگویید: " }));
          good.appendChild(document.createTextNode(item.good));
          card.appendChild(bad);
          card.appendChild(good);
          cmp.appendChild(card);
        });
        parent.appendChild(cmp);
      }
    });
  }

  function renderStage(id) {
    var mod = moduleById(id);
    if (!mod || !isUnlocked(id)) {
      main.appendChild(el("h1", { text: "این مرحله هنوز باز نیست" }));
      main.appendChild(el("p", { text: "اول تمرین مرحله قبل را ببندید." }));
      main.appendChild(el("a", { class: "button", href: "#/path", text: "برگشت به مسیر" }));
      return;
    }

    var layout = el("div", { class: "layout" });
    layout.appendChild(rail(id));
    var article = el("article", { class: "lesson" });
    article.appendChild(el("p", { class: "kicker", text: "مرحله " + fa(id) + " از ۸" }));
    article.appendChild(el("h1", { text: mod.title }));
    var rule = el("p", { class: "rule" });
    rule.appendChild(el("span", { text: "قاعده این مرحله" }));
    rule.appendChild(document.createTextNode(mod.rule));
    article.appendChild(rule);
    renderBlocks(article, mod.blocks);

    if (mod.exercise.type === "prep") article.appendChild(renderPrep("stage"));
    else article.appendChild(renderExercise(mod));

    layout.appendChild(article);
    main.appendChild(layout);
  }

  function renderExercise(mod) {
    var box = el("section", { class: "exercise", id: "exercise" });
    box.appendChild(el("h2", { text: mod.exercise.title }));
    box.appendChild(el("p", { text: mod.exercise.prompt }));
    var stored = state.answers[mod.id] || {};
    var passed = isDone(mod.id);

    mod.exercise.questions.forEach(function (question) {
      box.appendChild(renderQuestion(mod, question, stored, passed));
    });

    var result = el("div", { id: "result" });
    box.appendChild(result);

    if (passed) {
      result.appendChild(el("div", { class: "banner ok", text: "این مرحله بسته شده است." }));
      result.appendChild(nextActions(mod.id));
    } else {
      var button = el("button", { type: "button", text: "ثبت پاسخ" });
      button.addEventListener("click", function () { grade(mod, box); });
      box.appendChild(button);
    }
    return box;
  }

  function renderQuestion(mod, question, stored, passed) {
    var wrap = el("fieldset", { class: "q" });
    wrap.appendChild(el("legend", { class: "q-title", text: question.prompt }));
    question.options.forEach(function (option) {
      var input = el("input", { type: question.type === "multi" ? "checkbox" : "radio", name: "m" + mod.id + "-" + question.id, value: option.id });
      var chosen = stored[question.id];
      if (question.type === "multi") input.checked = Array.isArray(chosen) && chosen.indexOf(option.id) !== -1;
      else input.checked = chosen === option.id;
      if (passed) input.disabled = true;
      var label = el("label", { class: "option" + (passed && option.correct ? " right" : "") });
      label.appendChild(input);
      var text = el("span", { text: option.text });
      if (passed && option.correct) text.appendChild(el("span", { class: "why", text: option.why }));
      label.appendChild(text);
      wrap.appendChild(label);
    });
    return wrap;
  }

  function selectedValue(box, question, mod) {
    var name = "m" + mod.id + "-" + question.id;
    if (question.type === "multi") {
      return Array.prototype.map.call(box.querySelectorAll('input[name="' + name + '"]:checked'), function (input) {
        return input.value;
      });
    }
    var picked = box.querySelector('input[name="' + name + '"]:checked');
    return picked ? picked.value : "";
  }

  function questionCorrect(question, value) {
    var right = question.options.filter(function (option) { return option.correct; }).map(function (option) { return option.id; }).sort();
    if (question.type === "multi") {
      var got = (value || []).slice().sort();
      return right.length === got.length && right.every(function (id, index) { return id === got[index]; });
    }
    return right.length === 1 && value === right[0];
  }

  function grade(mod, box) {
    var answers = {};
    var missing = false;
    mod.exercise.questions.forEach(function (question) {
      var value = selectedValue(box, question, mod);
      answers[question.id] = value;
      if (question.type === "multi" ? value.length === 0 : !value) missing = true;
    });
    var result = box.querySelector("#result");
    result.replaceChildren();
    box.querySelectorAll(".option").forEach(function (label) { label.classList.remove("wrong", "right"); });
    box.querySelectorAll(".teach").forEach(function (node) { node.remove(); });

    if (missing) {
      result.appendChild(el("div", { class: "banner warn", text: "برای هر سؤال یک پاسخ انتخاب کنید." }));
      return;
    }

    var allCorrect = mod.exercise.questions.every(function (question) {
      return questionCorrect(question, answers[question.id]);
    });

    mod.exercise.questions.forEach(function (question) {
      var value = answers[question.id];
      var ok = questionCorrect(question, value);
      var field = box.querySelectorAll('input[name="m' + mod.id + "-" + question.id + '"]');
      Array.prototype.forEach.call(field, function (input) {
        var selected = question.type === "multi" ? value.indexOf(input.value) !== -1 : value === input.value;
        if (!selected) return;
        var option = question.options.filter(function (item) { return item.id === input.value; })[0];
        input.parentNode.classList.add(option.correct ? "right" : "wrong");
      });
      if (!ok) {
        var note = el("div", { class: "teach", text: question.teach });
        field[0].closest(".q").appendChild(note);
      }
    });

    if (!allCorrect) {
      result.appendChild(el("div", { class: "banner warn", text: "هنوز با استاندارد جور نیست. توضیح زیر سؤال را بخوانید و پاسخ را اصلاح کنید." }));
      result.scrollIntoView({ block: "nearest" });
      return;
    }

    state.answers[mod.id] = answers;
    markDone(mod.id);
    box.querySelectorAll("input").forEach(function (input) { input.disabled = true; });
    var currentLink = document.querySelector('.rail a[href="#/stage/' + mod.id + '"]');
    if (currentLink) currentLink.classList.add("done");
    result.appendChild(el("div", { class: "banner ok", text: "این مرحله بسته شد." }));
    result.appendChild(nextActions(mod.id));
    var submit = box.querySelector("button");
    if (submit) submit.disabled = true;
    result.scrollIntoView({ block: "nearest" });
  }

  function nextActions(id) {
    var row = el("div", { class: "actions" });
    if (id < 8 && isUnlocked(id + 1)) {
      row.appendChild(el("a", { class: "button", href: "#/stage/" + (id + 1), text: "مرحله بعد" }));
    }
    if (id === 8) {
      row.appendChild(el("a", { class: "button", href: "#/standard", text: "استاندارد" }));
      row.appendChild(el("a", { class: "button ghost", href: "#/ready", text: "برگه آمادگی" }));
    }
    row.appendChild(el("a", { class: "button ghost", href: "#/path", text: "فهرست مسیر" }));
    return row;
  }

  function renderStandard() {
    var sheet = el("article", { class: "sheet" });
    var head = el("div", { class: "print-head" });
    head.appendChild(el("img", { class: "print-logo", src: "assets/logo-light.png", alt: "KHODRO45.com" }));
    sheet.appendChild(head);
    sheet.appendChild(el("p", { class: "kicker no-print", text: "استاندارد" }));
    sheet.appendChild(el("h1", { text: data.title }));
    sheet.appendChild(el("p", { class: "muted", text: data.edition }));
    sheet.appendChild(el("p", { class: "lead", text: data.standard.lead }));

    data.standard.groups.forEach(function (group) {
      var section = el("section", { class: "standard-group" });
      section.appendChild(el("h2", { text: group.title }));
      var list = el("ul", { class: "clean" });
      group.items.forEach(function (item) { list.appendChild(el("li", { text: item })); });
      section.appendChild(list);
      sheet.appendChild(section);
    });

    var tools = el("div", { class: "toolbar no-print" });
    var print = el("button", { type: "button", text: "چاپ استاندارد" });
    print.addEventListener("click", function () { window.print(); });
    tools.appendChild(print);
    sheet.appendChild(tools);

    var shortcuts = el("section", { class: "shortcuts no-print" });
    shortcuts.appendChild(el("h2", { text: "میانبر مرور" }));
    if (state.completed.length === 8) {
      shortcuts.appendChild(el("p", { text: "مسیر را تمام کرده‌اید. برای مرور سریع، همان میانبرهای جعبه ابزار این‌جا باز است." }));
      data.standard.shortcuts.forEach(function (item) {
        var block = el("p");
        block.appendChild(el("strong", { text: item.title + ". " }));
        block.appendChild(document.createTextNode(item.path + " "));
        item.links.forEach(function (id, index) {
          if (index) block.appendChild(document.createTextNode("، "));
          block.appendChild(el("a", { href: "#/stage/" + id, text: "مرحله " + fa(id) }));
        });
        shortcuts.appendChild(block);
      });
    } else {
      shortcuts.appendChild(el("p", { text: "میانبرهای مرور بعد از تمام شدن هشت مرحله اینجا می‌آید." }));
    }
    sheet.appendChild(shortcuts);
    main.appendChild(sheet);
  }

  function renderReady() {
    var sheet = el("article", { class: "sheet", id: "prep-sheet" });
    var head = el("div", { class: "print-head" });
    head.appendChild(el("img", { class: "print-logo", src: "assets/logo-light.png", alt: "KHODRO45.com" }));
    sheet.appendChild(head);
    sheet.appendChild(el("p", { class: "kicker no-print", text: "آمادگی" }));
    sheet.appendChild(el("h1", { text: "برگه آماده‌سازی شخصی" }));
    sheet.appendChild(el("p", { class: "no-print", text: "قبل از هر حضور این برگه را پر کنید. چهار فیلد الزامی همان شرط بستن مرحله هشتم است." }));
    sheet.appendChild(reviewList());
    sheet.appendChild(renderPrep("ready"));
    main.appendChild(sheet);
  }

  function reviewList() {
    var box = el("section");
    box.appendChild(el("h2", { text: "مرور نهایی ۶۰ ثانیه‌ای" }));
    var list = el("ol", { class: "review" });
    data.review60.forEach(function (line) { list.appendChild(el("li", { text: line })); });
    box.appendChild(list);
    return box;
  }

  function renderPrep(mode) {
    var form = el("form", { class: "prep", id: "prep-form" });
    form.addEventListener("submit", function (event) { event.preventDefault(); });
    var status = el("p", { class: "banner no-print", id: "prep-status" });
    form.appendChild(status);

    data.prepFields.forEach(function (field) {
      var wrap = el("div", { class: "field" });
      var label = el("label", { for: "f-" + field.id });
      label.appendChild(document.createTextNode(field.label));
      if (field.required) label.appendChild(el("span", { class: "req", text: "الزامی" }));
      wrap.appendChild(label);
      if (field.hint) wrap.appendChild(el("span", { class: "hint", text: field.hint }));
      var control = field.rows > 1
        ? el("textarea", { id: "f-" + field.id, rows: String(field.rows) })
        : el("input", { id: "f-" + field.id, type: "text" });
      control.value = state.prep[field.id] || "";
      control.setAttribute("autocomplete", "off");
      control.addEventListener("input", function () {
        state.prep[field.id] = control.value;
        save();
        paintStatus(status, mode);
      });
      wrap.appendChild(control);
      form.appendChild(wrap);
    });

    var actions = el("div", { class: "actions no-print" });
    if (mode === "ready" || isUnlocked(8)) {
      var saveButton = el("button", { type: "button", text: mode === "stage" ? "ثبت و بستن مرحله" : "ذخیره برگه" });
      saveButton.addEventListener("click", function () { commitPrep(status, mode); });
      actions.appendChild(saveButton);
    }
    if (mode === "ready") {
      var print = el("button", { type: "button", class: "ghost", text: "چاپ برگه" });
      print.addEventListener("click", printReady);
      actions.appendChild(print);
    }
    form.appendChild(actions);
    paintStatus(status, mode);
    return form;
  }

  function paintStatus(status, mode) {
    var missing = missingRequired();
    status.className = "banner no-print " + (missing.length ? "warn" : "ok");
    if (!missing.length) {
      if (isDone(8)) status.textContent = "چهار فیلد الزامی پر است و مرحله هشتم بسته شده.";
      else if (!isUnlocked(8)) status.textContent = "چهار فیلد ذخیره شد. بستن مسیر بعد از تمام شدن مرحله هفتم باز می‌شود.";
      else status.textContent = "چهار فیلد الزامی پر است. با ثبت، مرحله هشتم بسته می‌شود.";
      return;
    }
    status.textContent = mode === "stage" && !isUnlocked(8)
      ? "اول هفت مرحله قبل را ببندید."
      : "برای بستن مسیر این‌ها هنوز خالی است: " + missing.map(function (field) { return field.label; }).join("، ");
  }

  function commitPrep(status, mode) {
    if (mode === "stage" && !isUnlocked(8)) return;
    var missing = missingRequired();
    paintStatus(status, mode);
    if (missing.length) {
      var first = document.getElementById("f-" + missing[0].id);
      if (first) first.focus();
      return;
    }
    if (isUnlocked(8)) {
      markDone(8);
      paintStatus(status, mode);
      if (mode === "stage" && !document.getElementById("prep-next")) {
        var row = nextActions(8);
        row.id = "prep-next";
        status.after(row);
      }
    }
  }

  function printReady() {
    var missing = missingRequired();
    if (missing.length) {
      var names = missing.map(function (field) { return field.label; }).join("\n");
      var ok = window.confirm("بعضی فیلدهای الزامی خالی است:\n" + names + "\n\nبرگه با همین متن چاپ شود؟");
      if (!ok) return;
    }
    window.print();
  }

  window.addEventListener("hashchange", render);
  render();
})();
