(ns milia-wrapper.milia
  (:require [cljs.nodejs :as nodejs]))

(nodejs/enable-util-print!)

(defn main [& [a name]]
  (case a
    "hi" (say_hi name)
    "hey" (say_hello name)
    (println "Nothing"))
  {"a" 1})

(defn ^:export say_hi [name]
  (println "Hello World!"))

(defn  ^:export say_hello []
  (println "I said"))

(set! js/module.exports #js {:say_hello say_hello
                             :say_hi say_hi})
