(defproject wrappers "0.0.1-SNAPSHOT"
  :description "Ona wrapper for milia"
  :url "https://github.com/onaio/karma/wrappers"
  :license {:name "Eclipse Public License - v 1.0"
            :url "http://www.eclipse.org/legal/epl-v10.html"
            :distribution :repo}
  :min-lein-version "2.3.4"
  :dependencies [[org.clojure/clojure "1.8.0"]
                 [org.clojure/clojurescript "1.9.521"]
                 [onaio/milia "0.3.28"]]
  :plugins [[lein-cljsbuild "1.1.4"]]
  :cljsbuild
  {:builds {:prod {:source-paths ["src"]
                   :compiler {:output-to "target/js/milia.js"
                              ;; :target :node-library
                              :output-dir "target"
                              ;; :exports {:say_hello milia-wrapper.milia}
                              :main milia-wrapper.milia
                              :optimizations :simple
                              :target :nodejs
                              :pretty-print true}}}})
