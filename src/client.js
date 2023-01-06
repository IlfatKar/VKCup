function tag(tag, ...children) {
  const el = document.createElement(tag);

  children.forEach((item) => {
    if (typeof item === "string") {
      el.appendChild(document.createTextNode(item));
    } else {
      item && el.appendChild(item);
    }
  });

  el.attr = function (...atributes) {
    atributes.forEach((item) => {
      el.setAttribute(item[0], item[1]);
    });
    return this;
  };

  el.addClass = function (name) {
    name && el.classList.add(name);
    return this;
  };

  el.removeClass = function (name) {
    el.classList.remove(name);
    return this;
  };

  el.onClick = function (callback) {
    el.onclick = callback;
    return this;
  };

  el.onScroll = function (callback) {
    el.onscroll = callback;
    return this;
  };

  el.onChange = function (callback) {
    el.onchange = callback;
    return this;
  };

  return el;
}

const GEN_TAGS = [
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "nav",
  "header",
  "button",
  "hr",
  "a",
  "input",
  "label",
];

GEN_TAGS.forEach((item) => {
  window[item] = (...children) => tag(item, ...children);
});

const themes = {
  light: {
    bg: "#00103d1f",
    navBg: "#fff",
  },
  dark: {
    bg: "#19191a",
    navBg: "#232324",
  },
  anime: {
    bg: `linear-gradient(
      180deg,
      rgba(117, 0, 69, 0.64) 0%,
      rgba(0, 9, 83, 0.64) 100%
    ),
    url("../assets/animeFull.jpg")`,
    navBg: "#6b1344",
  },
};

const state = {
  theme: themes.light,
  themeChangeListeners: [],
  messageId: null,
  sidebarIdx: 0,
  listeners: [],
  filters: [],
  lang: "Русский",
};

const sidebarItems = [
  ["mail.svg", "Входящие"],
  ["folder.svg", "Важное"],
  ["ressend.svg", "Отправленные"],
  ["textbook.svg", "Черновики"],
  ["arrowdown.svg", "Архив"],
  ["dislike.svg", "Спам"],
  ["trash.svg", "Корзина"],
];

const colors = [
  "red",
  "orange",
  "peach",
  "lime",
  "yellow",
  "green",
  "sea",
  "mint",
  "sky",
  "blue",
  "indigo",
  "violet",
  "lavender",
  "coral",
];

const categories = {
  Входящие: "order.svg",
  Финансы: "rub.svg",
  Регистрации: "register.svg",
  Путешевствия: "travel.svg",
  Билеты: "tickets.svg",
  "Штрафы и налоги": "taxes.svg",
  Заказы: "orders.svg",
};

const filters = {
  Непрочитанные: () => mark(),
  "С флажком": () => icon("mark-red.svg"),
  "С вложениями": () => icon("file.svg"),
};

const langIco = {
  Русский: "ru.svg",
  English: "usa.svg",
};

let setLoading = () => {};

const sleep = async (ms) =>
  new Promise((res, _) => setTimeout(() => res(), ms));

const img = (src) => {
  return tag("img").attr(["src", src]);
};

const icon = (path) => {
  const res = (path ? img("../assets/" + path) : div()).addClass("icon");
  res.size = function (size) {
    this.style.width = size + "px";
    this.style.height = size + "px";
    return this;
  };
  return res;
};

const folderItem = (...children) => {
  return div(...children).addClass("folder-item");
};

const buttonBorderless = (...children) => {
  return button(...children).addClass("button-borderless");
};

const mark = (status) => {
  const res = div().addClass("mark");
  if (status === 0) {
    res.addClass("hidden");
  } else if (status === 2) {
    res.addClass("grey");
  }

  return res;
};

const dateFromNow = (datetime) => {
  const date = new Date(datetime);
  const now = new Date();
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return p(date.getHours + ":" + date.getMinutes());
  } else {
    let str = date.toLocaleString("ru", {
      day: "2-digit",
      month: "short",
    });
    str = str.length > 7 ? str.slice(0, -(str.length - 6)) + "." : str;
    return p(str);
  }
};

const checkbox = () => {
  return tag("input").attr(["type", "checkbox"]);
};

const avatar = (name) => {
  const color = Math.floor(Math.random() * colors.length);

  return div(name[0])
    .addClass("color_" + colors[color])
    .addClass("avatarLetter");
};

const loading = () => {
  return div(icon("loading.svg").size(24)).addClass("loading");
};

const letter = ({
  id,
  author,
  title,
  text,
  bookmark,
  important,
  read,
  date,
  docs,
  flag,
}) => {
  const rmMark = (addMark) => {
    return (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.target.src = "/assets/important-grey.svg";
      e.target.addClass("important_hidden");
      e.target.onclick = addMark;
    };
  };

  const addMark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.target.src = "/assets/mark-red.svg";
    e.target.removeClass("important_hidden");
    e.target.onclick = rmMark(addMark);
  };
  let preview = div().addClass("preview").addClass("hidden");

  const getDocs = async (e) => {
    e.stopImmediatePropagation();
    state.listeners.forEach((item) => {
      item[1]();
      document.removeEventListener("click", item[0]);
    });
    const image = div();
    const image1 = div();
    const desc = p(
      "Image.png "
      // ((docs.img.length * 0.75) / 1048576).toFixed(2) + "MB"
    );
    const prev = div(
      div(
        div(image1, desc)
          .addClass("preview")
          .onClick((e) => e.stopPropagation())
      ).addClass("preview_wrapper"),
      div(image)
        .addClass("previewMax")
        .onClick((e) => e.stopPropagation())
    ).addClass("preview_block");

    fetch("/api/getDocs/" + id)
      .then((data) => data.json())
      .then((docs) => {
        image.replaceWith(img(docs.img));
        image1.replaceWith(img(docs.img));
        desc.textContent =
          "Image.png " + ((docs.img.length * 0.75) / 1048576).toFixed(2) + "MB";
      });

    preview.replaceWith(prev);
    preview = prev;

    const rmFn = () => {
      tmp = div().addClass("preview").addClass("hidden");
      preview.replaceWith(tmp);
      preview = tmp;
    };
    state.listeners.push([
      document.addEventListener("click", () => {
        state.listeners.forEach((item) => {
          item[1]();
          document.removeEventListener("click", item[0]);
        });
      }),
      rmFn,
    ]);
  };

  let isActive = false;
  const res = div(
    mark(read ? 1 : 0),
    div(
      (author.avatar ? img(author.avatar) : avatar(author.name)).addClass(
        "avatar"
      ),
      checkbox().onClick((e) => {
        e.stopPropagation();
        isActive = e.target.checked;
        if (isActive) {
          res.addClass("active");
        } else {
          res.removeClass("active");
        }
      })
    ).addClass("avatarBlock"),
    p(`${author.name} ${author.surname}`).addClass("bold").addClass("author"),
    bookmark || important
      ? icon(bookmark ? "mark-red.svg" : "alert.svg")
          .size(15)
          .addClass("important")
          .onClick(rmMark(addMark))
      : icon("important-grey.svg")
          .size(15)
          .addClass("important")
          .addClass("important_hidden")
          .onClick(addMark),
    p(title)
      .addClass(read ? "bold" : "")
      .addClass("title")
      .addClass("text"),
    p(text).addClass("text"),
    flag && icon(categories[flag]).size(15),
    docs &&
      div(icon("file.svg").size(15).addClass("inverted"))
        .addClass("docs")
        .onClick(getDocs),
    dateFromNow(date).addClass("date"),
    preview
  ).addClass("letter");
  return res;
};

const Letters = async (openMessage) => {
  const limit = 50;
  let skip = 0;
  const folder = sidebarItems[state.sidebarIdx][1];
  let isLoading = false;
  const fetchLetters = async () => {
    if (state.filters.length) {
      return await fetch(`/api/getFiltred/${folder}/${limit}/${skip}`, {
        header: {
          "Content-Type": "application/json",
        },
        method: "post",
        body: JSON.stringify({
          bookmark: state.filters.includes("С флажком"),
          read: state.filters.includes("Непрочитанные"),
          doc: state.filters.includes("С вложениями"),
        }),
      }).then((data) => data.json());
    }
    return await fetch(`/api/getMessages/${folder}/${limit}/${skip}`).then(
      (data) => data.json()
    );
  };
  const letters = await fetchLetters();
  const emptyImg = img(
    `../assets/empty_${state.theme === themes.dark ? "dark" : "light"}.png`
  );
  const empty = div(emptyImg, p("Писем нет")).addClass("letters_empty");
  state.themeChangeListeners.push(() => {
    emptyImg.src = `../assets/empty_${
      state.theme === themes.dark ? "dark" : "light"
    }.png`;
  });
  const res = letters.length
    ? div(
        ...letters.map((item) =>
          letter(item).onClick(() => {
            openMessage(item.id);
          })
        )
      )
        .addClass("letters")
        .onScroll(async (e) => {
          if (e.target.scrollTopMax === e.target.scrollTop) {
            skip += 50;
            if (!isLoading) {
              setLoading(1);
              isLoading = true;
              const load = loading();
              res.append(load);
              const letters = await fetchLetters();
              setLoading(2);
              sleep(250).then(() => {
                setLoading(0);
              });
              load.remove();
              res.append(
                ...letters.map((item) =>
                  letter(item).onClick(() => {
                    openMessage(1);
                  })
                )
              );
            }
          }
        })
    : empty;
  return res;
};

const Message = async () => {
  setLoading(1);
  const message = await fetch("/api/message/" + state.messageId).then(
    (data) => {
      setLoading(2);
      return data.json();
    }
  );

  sleep(250).then(() => {
    setLoading(0);
  });

  let date_str = "";
  const now = new Date();
  const date = new Date(message.date);
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    date_str = "Сегодня, " + date.getHours + ":" + date.getMinutes();
  } else {
    date_str = date.toLocaleString("ru", {
      day: "2-digit",
      month: "long",
    });
  }

  let recivers = "";
  for (let i = 0; i < (3 > message.to.length ? message.to.length : 3); i++) {
    recivers += message.to[i].name + " " + message.to[i].surname + ", ";
  }
  recivers = recivers.slice(0, -2);

  return div(
    div(
      h2(message.title),
      message.flag &&
        div(icon(categories[message.flag]), p(message.flag)).addClass("row")
    ).addClass("message_title"),
    div(
      mark(message.read ? 1 : 2),
      message.author.avatar
        ? img(message.author.avatar)
        : avatar(message.author.name),
      div(
        div(
          p(message.author.name + " " + message.author.surname),
          p(" " + date_str),
          message.bookmark || message.important
            ? icon(message.bookmark ? "mark-red.svg" : "alert.svg")
                .size(15)
                .addClass("important")
            : icon().size(15).addClass("important")
        ).addClass("row"),
        p(
          `Кому: Вы, ${recivers} `,
          message.to.length - 3 > 0 &&
            span(
              `ещё ${message.to.length - 3} ${
                message.to.length === 1
                  ? "получатель"
                  : message.to.length < 5
                  ? "получателя"
                  : "получателей"
              }`
            )
        )
      )
    ).addClass("addreses"),
    message.doc &&
      div(
        div(
          img(message.doc.img),
          a(icon("download.svg").size(15), "Скачать")
            .attr(["href", message.doc.img])
            .attr(["download", "Image.png"])
        ).addClass("file"),
        div(
          p(`1 файл`),
          a(
            "Скачать",
            span(
              ` (${((message.doc.img.length * 0.75) / 1048576).toFixed(2)}Mb)`
            )
          )
            .attr(["href", message.doc.img])
            .attr(["download", "Image.png"])
        )
      ).addClass("files"),
    p(message.text).addClass("text").attr(["style", "white-space: pre-line;"])
  ).addClass("message");
};

const filterSelect = (change) => {
  const clearFilters = () => {
    state.filters = [];
    menu_items.forEach((item) => {
      item.addClass("not_select");
    });
    all.removeClass("not_select");
    change();
  };
  const all = div(icon("select.svg"), p("Все письма"))
    .addClass("menu_item")
    .addClass(state.filters.length ? "not_select" : "")
    .onClick(clearFilters);
  const selectFn = (title) => (e) => {
    const target = e.target.closest(".menu_item");
    if (state.filters.includes(title)) {
      target.addClass("not_select");
      state.filters = state.filters.filter((item) => item !== title);
    } else {
      state.filters.push(title);
      target.removeClass("not_select");
    }
    if (state.filters.length) {
      all.addClass("not_select");
    } else {
      all.removeClass("not_select");
    }
    change();
  };
  const menu_items = [
    div(
      icon("select.svg"),
      div(mark()).addClass("icon_wrapper"),
      p("Непрочитанные")
    )
      .addClass("menu_item")
      .addClass(!state.filters.includes("Непрочитанные") ? "not_select" : "")
      .onClick(selectFn("Непрочитанные")),
    div(
      icon("select.svg"),
      div(icon("mark-red.svg")).addClass("icon_wrapper"),
      p("С флажком")
    )
      .addClass("menu_item")
      .addClass(!state.filters.includes("С флажком") ? "not_select" : "")
      .onClick(selectFn("С флажком")),
    div(
      icon("select.svg"),
      div(icon("file.svg").addClass("inverted")).addClass("icon_wrapper"),
      p("С вложениями")
    )
      .addClass("menu_item")
      .addClass(!state.filters.includes("С вложениями") ? "not_select" : "")
      .onClick(selectFn("С вложениями")),
  ];
  const res = div(
    all,
    ...menu_items,
    hr(),
    div(icon().size(10), p("Сбросить все"))
      .addClass("menu_item")
      .onClick(clearFilters)
  )
    .addClass("filter_select")
    .addClass("remove");

  res.changeState = function (isOpen) {
    isOpen ? res.removeClass("remove") : res.addClass("remove");
  };

  return res;
};

const filter = (onChangeFolder) => {
  let isOpen = false;
  const selectedIcons = div();
  const filterTextFn = () =>
    state.filters.length > 1
      ? "Фильтры"
      : state.filters.length === 1
      ? state.filters[0]
      : "Фильтр";
  const filterText = p(filterTextFn());
  const update = () => {
    Array.from(selectedIcons.children).forEach((child) => child.remove());
    state.filters.forEach((item) => {
      const el = filters[item]();
      if (item === "С вложениями") {
        el.addClass("inverted");
      }
      selectedIcons.appendChild(el);
    });
  };
  const select = filterSelect(() => {
    filterText.textContent = filterTextFn();
    update();
    onChangeFolder();
  });
  update();
  const res = div(
    div(
      selectedIcons.addClass("selected_icons"),
      filterText,
      icon("filter_arrowdown.svg").addClass("inverted")
    )
      .addClass("filterBtn")
      .onClick(() => {
        isOpen = !isOpen;
        select.changeState(isOpen);
      }),
    select
  );
  return res;
};

const Navbar = (onBack, onChangeFolder) => {
  const image = img(
    `../assets/${state.theme === themes.light ? "logo" : "logo_dark"}.svg`
  );
  const filterEl = filter(onChangeFolder);
  let res = nav(div(icon("clip.svg"), image), filterEl).addClass("nav_gap");

  setLoading = (status) => {
    if (status === 1) {
      res.addClass("loading");
    } else if (status === 2) {
      res.addClass("loading").addClass("end");
    } else {
      res.removeClass("loading").removeClass("end");
    }
  };

  const setUpdateTheme = () => {
    res.updateTheme = function () {
      image.attr([
        "src",
        `../assets/${state.theme === themes.light ? "logo" : "logo_dark"}.svg`,
      ]);
      return res;
    };
  };
  setUpdateTheme();

  res.setBack = function (isBack) {
    if (!isBack) {
      res = nav(div(icon("clip.svg"), image), filterEl).addClass("nav_gap");
    } else {
      res = nav(
        icon("back.svg").addClass("inverted").addClass("backBtn").size(11),
        p("Вернуться")
      )
        .addClass("pointer")
        .onClick(() => {
          onBack();
        });
    }
    setUpdateTheme();
    return res;
  };

  return res;
};

const SettingsTheme = (changeTheme) => {
  const colors = [
    "#4A352F",
    "#424242",
    "#5A355A",
    "#35385A",
    "#646ECB",
    "#E73672",
    "#F44336",
    "#388E3C",
    "#81D8D0",
    "#E2DCD2",
    "#FFEBCD",
    "#E7EED2",
    "#D0F0F7",
    "#C9D0FB",
    "#DDF3FF",
    "#F0F0F0",
  ];
  function setTheme(theme) {
    return () => {
      changeTheme(theme);
      res.children[1].replaceWith(colorsEl());
      res.children[2].replaceWith(themesEl());
    };
  }
  colors.forEach((color) => {
    themes[color] = { bg: color, navBg: `rgba(0,0,0,.23)` };
  });
  const colorsEl = () =>
    div(
      ...colors.map((color) =>
        div(div(icon("select_white.svg").size(24)).addClass("icon_wrapper"))
          .attr(["style", `background: ${color}`])
          .addClass("colorTheme")
          .addClass(state.theme === color ? "active" : "")
          .onClick(setTheme(themes[color]))
      )
    ).addClass("colors");

  const themesEl = () =>
    div(
      div(div(icon("select_white.svg").size(24)).addClass("icon_wrapper"))
        .attr([
          "style",
          `background: url(../assets/clip.svg) no-repeat center, url(../assets/logo_dark.svg) no-repeat center #000;
            background-position-x: 24px, 55px;
            background-size: 24px, 45px;
            background-position-y: center;`,
        ])
        .addClass(state.theme === themes.dark ? "active" : "")
        .onClick(setTheme(themes.dark)),
      div(div(icon("select_white.svg").size(24)).addClass("icon_wrapper"))
        .attr([
          "style",
          `background: url(../assets/clip.svg) no-repeat center, url(../assets/logo.svg) no-repeat center #fff;
            background-position-x: 24px, 55px;
            background-size: 24px, 45px;
            background-position-y: center;`,
        ])
        .addClass(state.theme === themes.light ? "active" : "")
        .onClick(setTheme(themes.light)),
      div(div(icon("select_white.svg").size(24)).addClass("icon_wrapper"))
        .attr([
          "style",
          "background: url(../assets/anime_preview.jpg) no-repeat; background-size: cover;",
        ])
        .addClass(state.theme === themes.anime ? "active" : "")
        .onClick(setTheme(themes.anime))
    ).addClass("themes");

  const res = div(
    p("Настройки внешнего вида вашей почты и темы оформления"),
    colorsEl(),
    themesEl()
  ).addClass("setings_themes");

  return res;
};

const SettingsLang = () => {
  const radio = (title) =>
    label(
      input()
        .onChange(() => {
          state.lang = title;
        })
        .attr(["type", "radio"])
        .attr(["name", "lang"])
        .attr(state.lang === title ? ["checked", ""] : []),
      icon(langIco[title]),
      p(title)
    );
  const res = div(
    p("Изменить язык"),
    div(radio("Русский", "ru.svg"), radio("English", "usa.svg")).addClass(
      "langs"
    ),
    button("Выбрать язык")
  ).addClass("settingsLang");

  return res;
};

const Settings = (onClose, changeTheme) => {
  let tab = 0;
  let content = tab === 0 ? SettingsTheme(changeTheme) : SettingsLang();
  const SettingsSidebar = () =>
    div(
      folderItem("Внешний вид")
        .addClass(tab === 0 ? "active" : "")
        .onClick((e) => {
          Array.from(e.target.closest(".settings_sidebar").children).forEach(
            (item) => item.removeClass("active")
          );
          e.target.closest(".folder-item").addClass("active");
          tab = 0;
          const tabEl = SettingsTheme(changeTheme);
          content.replaceWith(tabEl);
          content = tabEl;
        }),
      folderItem(span("Язык: "), span("Русский"), icon(langIco[state.lang]))
        .addClass(tab === 1 ? "active" : "")
        .onClick((e) => {
          Array.from(e.target.closest(".settings_sidebar").children).forEach(
            (item) => item.removeClass("active")
          );
          e.target.closest(".folder-item").addClass("active");
          tab = 1;
          const tabEl = SettingsLang();
          content.replaceWith(tabEl);
          content = tabEl;
        })
    ).addClass("settings_sidebar");
  const res = div(
    div(SettingsSidebar(), content)
      .addClass("settings")
      .onClick((e) => e.stopPropagation())
  )
    .addClass("settings_wrapper")
    .onClick(onClose);

  return res;
};

const Sidebar = (onChangeFolder, onSettings) => {
  const settingsBtn = folderItem(icon("settings.svg"), span("Настройки"));

  const getFolders = () => {
    return sidebarItems.map((item, idx) => {
      const el = folderItem(icon(item[0]).size(16), span(item[1]));
      if (idx === state.sidebarIdx) {
        el.addClass("active");
      }
      return el;
    });
  };

  let foldersWrapper = div(div()).addClass("folders");
  const drawFolders = () => {
    foldersWrapper
      .replaceChild(
        div(
          ...getFolders().map((item, idx) =>
            item.onClick(() => {
              state.sidebarIdx = idx;
              drawFolders();
              onChangeFolder();
            })
          )
        ),
        foldersWrapper.lastChild
      )
      .addClass("folders");
  };
  drawFolders();

  return div(
    div(
      button(icon("pencil.svg"), span("Написать письмо")).addClass(
        "writeLetter"
      ),
      foldersWrapper,
      hr(),
      buttonBorderless(icon("plus.svg").addClass("inverted"), "Новая папка")
    ),
    settingsBtn.onClick(onSettings).addClass("settingsBtn")
  ).addClass("sidebar");
};

const Layout = (content, goBack, onChangeFolder) => {
  let isSettings = false;

  const navbar = Navbar(() => {
    goBack();
  }, onChangeFolder).setBack(typeof state.messageId === "number");

  const currTheme = () =>
    state.theme === themes.dark
      ? "darkTheme"
      : state.theme === themes.light
      ? "lightTheme"
      : "customTheme";

  function changeTheme(theme) {
    res.removeClass(currTheme());
    state.theme = theme;
    res.addClass(currTheme());

    res.style.setProperty("--bg", state.theme.bg);
    res.style.setProperty("--navBg", state.theme.navBg);

    navbar.updateTheme(state.theme);
    state.themeChangeListeners.forEach((item) => item());
    return state.theme;
  }

  const contentWrapper = div(
    header(navbar),
    div(Sidebar(onChangeFolder, onSettings), content).addClass("content")
  ).addClass("contentWrapper");

  function onSettings() {
    isSettings = !isSettings;
    contentWrapper.removeClass("scalable");
    res.lastChild.addClass("hidden");
    if (isSettings) {
      contentWrapper.addClass("scalable");
      res.lastChild.removeClass("hidden");
    }
  }

  const res = div(
    contentWrapper,
    Settings(onSettings, changeTheme).addClass("hidden")
  )
    .addClass("layout")
    .addClass(currTheme());

  return res;
};

const Main = async (app) => {
  const onChangeFolder = async () => {
    setLoading(1);
    state.messageId = null;
    app.lastChild.lastChild.replaceWith(await lettersNode(messageNode));
    setLoading(2);
    sleep(250).then(() => {
      setLoading(0);
    });
  };
  const lettersNode = async (messageNode) =>
    await Layout(
      await Letters(async (id) => {
        state.messageId = id;
        app.lastChild.lastChild.replaceWith(await messageNode());
        return app.lastChild.lastChild;
      }),
      null,
      onChangeFolder
    );

  const messageNode = async () =>
    await Layout(
      await Message(),
      async () => {
        setLoading(1);
        state.messageId = null;
        app.lastChild.lastChild.replaceWith(await lettersNode(messageNode));
        setLoading(2);
        sleep(250).then(() => {
          setLoading(0);
        });
        return app.lastChild.lastChild;
      },
      onChangeFolder
    );

  let wrapper = div(await lettersNode(messageNode));

  return wrapper;
};

addEventListener("DOMContentLoaded", async () => {
  const app = document.querySelector("#app");
  app.appendChild(await Main(app));
});
// TODO: theme local save
