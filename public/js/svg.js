'use strict';
/** Created by alex on 20.02.2017 **/

var svgObj = {
  chatLoader: '<svg id="chat-loader" style="top: calc(50% - 32px); position: absolute; left: calc(50% - 32px); width: 64px; height: 64px" viewBox="0 0 128 128" xml:space="preserve"><g><path d="M75.4 126.63a11.43 11.43 0 0 1-2.1-22.65 40.9 40.9 0 0 0 30.5-30.6 11.4 11.4 0 1 1 22.27 4.87h.02a63.77 63.77 0 0 1-47.8 48.05v-.02a11.38 11.38 0 0 1-2.93.37z" fill="#000000" fill-opacity="1"/><animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="1800ms" repeatCount="indefinite"></animateTransform></g></svg>',

  verified: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10.923 13">\
             <title>Verified user. It is a user who has confirmed his identity that he is not a fraud.</title>\
             <path d="M10.909 3.348a50.81 50.81 0 0 1-.013-1 .455.455 0 0 0-.455-.455A6.274 6.274 0 0 1 5.778.129a.455.455 0 0 0-.634 0 6.273 6.273 0 0 1-4.662 1.76.455.455 0 0 0-.455.455c0 .321-.006.653-.013 1-.062 3.266-.148 7.74 5.3 9.627a.455.455 0 0 0 .3 0c5.443-1.884 5.357-6.357 5.295-9.623z" \
               fill="#0081d1"/>\
               <path d="M8.013 4.355l-3.1 3.1L3.59 6.132a.642.642 0 0 0-.908.908l1.777 1.777a.642.642 0 0 0 .908 0l3.554-3.554a.642.642 0 1 0-.908-.908z" \
               fill="#fff"/>\
           </svg>',

  verticalDots: '<svg class="post-info" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 16">\
                 <path d="M2 4a2 2 0 1 0-2-2 2.006 2.006 0 0 0 2 2zm0 2a2 2 0 1 0 2 2 2.006 2.006 0 0 0-2-2zm0 6a2 2 0 1 0 2 2 2.006 2.006 0 0 0-2-2z"\
                 fill-rule="evenodd" opacity=".54"/>\
                 </svg>',

  heartBlack: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10.889 9.432">\
               <path d="M10.889 2.94a2.938 2.938 0 0 0-5.444-1.536A2.938 2.938 0 1 0 1.01 5.153L5.177 9.32a.379.379 0 0 0 .537 0l4.167-4.167a2.93 2.93 0 0 0 1.008-2.213z"\
                fill="#747474"/>\
              </svg>',

  heartWhite: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 14.86">\
               <path d="M16.5 4.821a4.317 4.317 0 0 0-8-2.256 4.317 4.317 0 1 0-6.517 5.51l6.123 6.123a.558.558 0 0 0 .789 0l6.123-6.123A4.3 4.3 0 0 0 16.5 4.821z"\
                 fill="none" stroke="#747474"/>\
               </svg>',

  arrow: '<svg class="arrow-more" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 129 129" width="48"\
               height="48">\
              <path d="M121.3 34.6c-1.6-1.6-4.2-1.6-5.8 0l-51 51.1-51.1-51.1c-1.6-1.6-4.2-1.6-5.8 0-1.6 1.6-1.6 4.2 0 5.8l53.9 53.9c.8.8 1.8 1.2 2.9 1.2 1 0 2.1-.4 2.9-1.2l53.9-53.9c1.7-1.6 1.7-4.2.1-5.8z"/>\
          </svg>',

  closeCross: '<svg height="13" width="13" viewBox="0 0 16.414 16.414" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#fff" stroke-miterlimit="10" stroke-width="2"><path d="m.707.707 15 15"/><path d="m.707 15.707 15-15"/></g></svg>',
};

