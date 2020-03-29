"use strict"

const SearchMethod = {
  currentSearchString: "",
  patternDivision: function(src, re) {
    const result = []
    const length = src.length
    re.lastIndex = 0
    let matched
    let lastIndex = 0
    let found
    let prefixLength
    while (matched = re.exec(src)) {
      found = matched[0]
      prefixLength = re.lastIndex - lastIndex - found.length
      if (prefixLength > 0) {
        result.push(["u", src.substring(lastIndex, lastIndex + prefixLength)])
      }
      lastIndex = re.lastIndex
      if (found.length === 0) {
        re.lastIndex += 1
      }
      result.push(["m", found])
    }
    if (lastIndex < length) {
      result.push(["u", src.substring(lastIndex, length)])
    }
    return result
  },
  methodNameSpan: function(name, reKeywords) {
    const result = document.createElement("span")
    SearchMethod.patternDivision(name, /(?:::|\.#?|#|(?=\$))/g).forEach(function(chunk) {
      if (chunk[0] === "m") {
        const elem = document.createElement("span")
        elem.classList.add("method-links__delimiter")
        elem.innerText = chunk[1]
        result.appendChild(elem)
      } else {
        const elem = document.createElement("span")

        SearchMethod.patternDivision(chunk[1], reKeywords).forEach(function(cnk) {
          const e = document.createElement("span")
          e.innerText = cnk[1]
          if (cnk[0] === "m") {
            e.classList.add("method-links__hit")
          }
          elem.appendChild(e)
        })
        result.appendChild(elem)
      }
    })
    return result
  },
  normalizeSearchString: function(str) {
    const charShift = function(offset) {
      return function(char) {
        return String.fromCharCode(char.charCodeAt(0) + offset)
      }
    }
    return str.
      replace(/[\uFF01-\uFF5E]/g, charShift(-0xFEE0)).
      replace(/[A-Z]/g, charShift(0x20)).
      replace(/[^\u0021-\u007E]+/g, " ").
      replace(/^ | $/g, "")
  },
  retrieve: function(keywords) {
    return methodEntries.filter(function(item) {
      const str = item.s
      return keywords.every(function(kw) {
        return str.indexOf(kw) >= 0
      })
    })
  },
  search: function(searchStr, renderElem) {
    searchStr = SearchMethod.normalizeSearchString(searchStr)
    if (searchStr !== SearchMethod.currentSearchStr) {
      if (searchStr === "") {
        renderElem.innerHTML = ""
        return
      }

      SearchMethod.currentSearchStr = searchStr
      const keywords = searchStr.split(" ")
      const reKeywords = new RegExp(
        keywords.map(function(s) {
          return s.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')
        }).join("|"),
        "gi"
      )
      const entries = SearchMethod.retrieve(keywords)

      const ul = document.createElement("ul")
      ul.classList.add("method-links")
      let count = 0
      entries.forEach(function(entry) {
        count += 1
        if (count > 100) {
          return
        }
        const li = document.createElement("li")
        ul.appendChild(li)
        const a = document.createElement("a")
        li.appendChild(a)
        a.href = "/method/" + entry.p
        a.href = "https://docs.ruby-lang.org/ja/2.7.0/method/" + entry.p + ".html"
console.log(reKeywords)
        a.appendChild(SearchMethod.methodNameSpan(entry.k, reKeywords))
      })
      renderElem.innerHTML = ""
      renderElem.appendChild(ul)

      const info = document.createElement("div")
      info.classList.add("method-links__info")
      if (entries.length === 0) {
        info.innerText = "見つかりませんでした。"
      } else {
        info.innerText = ((entries.length > 100) ? "ほか" : "") +
        "（計 " + entries.length + " 件）"
      }
      renderElem.appendChild(info)
    }
  },
  setSearch: function(params) {
    if (params.searchField) {
      const sc = document.createElement("script")
      sc.src = "method-entries.js"
      document.body.appendChild(sc)
      setInterval(function() {
        SearchMethod.search(params.searchField.value, params.resultElem)
      }, params.intervalMs)
    }
  }
};

window.onload = function() {
  SearchMethod.setSearch({
    resultElem: document.getElementById("searchResult"),
    searchField: document.getElementById("searchMethodField"),
    intervalMs: 750,
  })
}
