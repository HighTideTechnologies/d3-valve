(function ($) {
  $.fn.valve = function (config) {
    var $this = $(this);
    return new Valve($this, config);
  };

  class Valve {
    constructor($this, config) {
      this.container = $this;

      this.o = $.extend({}, {
        pi: Math.PI,
        width: 0,
        height: 0,
        innerRad: null,
        outerRad: null,
        sideRectWidth: 40,
        sideRectHeight: 100,
        strokeWidth: 2,
        strokeColor: "#333",
        bodyColor: "#949494",
        centerRad: null,
        centerStrokeWidth: 3,
        centerColor: "#fafafa",
        duration: 500,
        labelFontSize: 15,
        labelFontColor: "#333",
        labelFontWeight: "bold",
        openLabel: "Open",
        closedLabel: "Closed",
        labelBgColor: "#fafafa",
        labelPadding: 3,
        labelBgCornerRadius: 3,
        waterColor: "#3fabd4",
        waveColor: "#389fc5",
        currentColor: "#14a5de",
        waveWidth: 100,
        amplitude: 5,
        waveDuration: 2000,
        currentDuration: 2000,
        valveDiskOpacity: 1,
      }, this.container.data(), config);

      this.open = true;
      this.animating = false;
      this.waves = [];
      this.currentEnabled = false;
      this.waveEnabled = false;
      this.url = window.location.href;

      this.init();
    }

    init() {
      this.initContainer();
      this.drawBody();    
      this.drawBackgroundWater();
      this.drawValve();
      this.drawForgroundWater();
      this.drawLabel();
    }

    initContainer() {
      this.initSvg();
      this.initGroup();
      this.calculateDimensions();
    }

    drawBody() {
      this.addMainCircle();
      this.addSideRect();
      this.positionSideRect();
      this.addMask();
      this.addCenter();
    }

    drawValve() {
      this.addValveDisk();
      this.addCylinder();
    }

    drawForgroundWater() {
      this.createWater();
      this.drawWave();
    }

    drawWave() {
      let height = this.waveHeightGauge(80);
      this.createWave(height, this.o.waveWidth*0.7, this.o.amplitude, this.o.waveDuration, this.o.waveColor);
      height = this.waveHeightGauge(20);
      this.createWave(height, this.o.waveWidth, this.o.amplitude, this.o.waveDuration*1.5, this.o.waterColor);
    }

    drawLabel() {
      this.addLabel();
      this.addLabelBg();
      this.positionLabelBg();
    }

    initSvg() {
      this.o.width = this.container.outerWidth();
      this.o.height = this.container.outerHeight();
      let viewBoxDef = `0, 0, ${this.o.width}, ${this.o.height}`;

      this.svgContainer = d3.select(this.container[0])
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", viewBoxDef);
    }

    initGroup() {
      let transform = `translate(${this.o.width/2}, ${this.o.height/2})`;

      this.g = this.svgContainer
        .append("g")
        .attr("transform", transform);
    }

    calculateDimensions() {
      let possibleWidth = this.o.width - this.o.sideRectWidth/4 - this.o.strokeWidth; //change the number to change how close circle is to edges
      let possibleHeight = this.o.height - this.o.strokeWidth;

      this.o.outerRad = Math.min(possibleWidth, possibleHeight)/2;
      this.o.innerRad = this.o.outerRad - this.o.strokeWidth/2;
      this.o.centerRad = this.o.outerRad*3/4;

      this.waveHeightGauge = d3.scaleLinear()
        .domain([0, 100])
        .range([this.o.centerRad, -this.o.centerRad]);
    }

    addMainCircle() {
      this.mainCircle = this.g.append("circle")
        .attr("r", this.o.outerRad)
        .attr("fill", "white")
        .attr("stroke-width", this.o.strokeWidth)
        .attr("stroke", this.o.strokeColor);
    }

    addSideRect() {
      this.leftRect = this.g.append("rect")
        .attr("width", this.o.sideRectWidth)
        .attr("height", this.o.sideRectHeight)
        .attr("fill", this.o.bodyColor)
        .attr("stroke-width", this.o.strokeWidth)
        .attr("stroke", this.o.strokeColor);

      this.rightRect = this.g.append("rect")
        .attr("width", this.o.sideRectWidth)
        .attr("height", this.o.sideRectHeight)
        .attr("fill", this.o.bodyColor)
        .attr("stroke-width", this.o.strokeWidth)
        .attr("stroke", this.o.strokeColor);
    }

    positionSideRect() {
      let leftXOffset = -(this.o.width/2 - this.o.strokeWidth/2);
      let rightXOffset = this.o.width/2 - this.o.sideRectWidth - this.o.strokeWidth/2;

      this.leftRect.attr("transform", `translate(${leftXOffset}, ${-this.o.sideRectHeight/2})`);
      this.rightRect.attr("transform", `translate(${rightXOffset}, ${-this.o.sideRectHeight/2})`);
    }

    addMask() {
      let rad = this.o.outerRad - this.o.strokeWidth/2;
      let rectDef = `translate(-${this.o.width/2-this.o.strokeWidth}, -${this.o.sideRectHeight/2 - this.o.strokeWidth/2})`;

      this.circleMask = this.g.append("circle")
        .attr("r", rad)
        .style("fill", this.o.bodyColor);

      this.rectMask = this.g.append("rect")
        .attr("width", this.o.width - this.o.strokeWidth*2)
        .attr("height", this.o.sideRectHeight - this.o.strokeWidth)
        .attr("fill", this.o.bodyColor)
        .attr("transform", rectDef);
    }

    addCenter() {
      this.center = this.g.append("circle")
        .attr("r", this.o.centerRad)
        .attr("fill", "#555") //this.o.centerColor
        .attr("stroke-width", this.o.centerStrokeWidth)
        .attr("stroke", this.o.strokeColor);
    }

    // utility functions
    uniqId() {
      // Convert it to base 36 (numbers + letters), and grab the first 9 characters
      // after the decimal.
      return "clipPath" + Math.random().toString(36).substr(2, 9);
    }
    getUniqUrl(id) {
      return `url(${this.url}#${id})`;
    }
    getWaterFillWidth() {
      if (this.open === true) {
        return this.o.centerRad*2;
      }
      return this.o.centerRad;
    }
    getGradEndOffset() {
      if (this.open === true) {
        return "100%";
      }
      return "50%";
    }
    getGradEndFill() {
      if (this.open === true) {
        return "#fff";
      }
      return "#000";
    }
    getCurrentMaskFillOpacity() {
      if (this.open === true) {
        return 1;
      }
      return 0;
    }
    getvalveDiskOpacity() {
      if (this.open === true) {
        return 1;
      }
      return this.o.valveDiskOpacity;
    }
    getCylinderOpacity() {
      if (this.open === true) {
        return 1;
      }
      return 1;
    }
    getTransform() {
      if (this.open === true) {
        return "rotate3d(0,1,0,0deg)";
      }
      return "rotate3d(0,1,0,90deg)";
    }

    // half circle water fill layer that is displayed when valve is closed.
    drawBackgroundWater() {
      let uniqId = this.uniqId();

      this.staticWaterClip = this.g.append("clipPath")
        .attr("id", uniqId);
      this.staticWaterClipArea = this.staticWaterClip.append("rect")
        .attr("width", this.o.centerRad + 0.3)
        .attr("height", this.o.centerRad*2 + 0.3)
        .style("transform", `translate(-${this.o.centerRad}px, -${this.o.centerRad}px)`)

      let clipPath = this.getUniqUrl(uniqId);
      this.staticWaterFill = this.g.append("circle")
        .attr("r", this.o.centerRad - this.o.centerStrokeWidth/2 + 0.3)
        .attr("fill", this.o.waterColor)
        .attr("clip-path", clipPath);
    }

    // full circle water layer that will have animating gradients.
    createWater() {
      let uniqId = this.uniqId();

      this.waterGradient = this.g.append("linearGradient")
        .attr("id", uniqId)
        .attr("x1", "0")
        .attr("y1", "0")
        .attr("x2", "1")
        .attr("y2", "0")
        .attr("spreadMethod", "pad");

      this.waterGradStart = this.waterGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#fff")
        .attr("stop-opacity", 1);

      let offset = this.getGradEndOffset();
      let fill = this.getGradEndFill();
      this.waterGradEnd = this.waterGradient.append("stop")
        .datum({ fill: fill, offset: offset })
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.fill; })
        .attr("stop-opacity", 1);

      let gradientPath = this.getUniqUrl(uniqId);
      let waterId = this.uniqId();
      this.waterMask = this.g.append("mask")
        .attr("id", waterId);

      let width = this.getWaterFillWidth();
      this.waterMaskFill = this.waterMask.append("rect")  //animate this
        .datum({ width: width })
        .attr("width", this.o.centerRad*2 + 0.3)
        .attr("height", this.o.centerRad*2 + 0.3)
        .attr("fill", gradientPath)
        .style("transform", `translate(-${this.o.centerRad}px, -${this.o.centerRad}px)`);

      this.waterGroup = this.g.append("g");

      let maskPath = this.getUniqUrl(waterId);
      let waterFill = this.waterGroup.append("circle")
      .attr("r", this.o.centerRad - this.o.centerStrokeWidth/2 + 0.3)
      .attr("fill", this.o.waterColor);

      this.waterGroup.attr("mask", maskPath);
    }


    // valve layer that will animate to spin when the valve state changes between open and close.
    addValveDisk() {
      let transform = this.getTransform();
      let opacity = this.getvalveDiskOpacity();

      this.valveDisk = this.g.append("circle")
        .datum({transform: transform, opacity: opacity})
        .attr("r", this.o.centerRad - this.o.centerStrokeWidth/2 + 0.5)
        .attr("fill", this.o.bodyColor)
        .attr("fill-opacity", function(d) {return d.opacity})
        .style("transform", function(d) {return d.transform});
    }

    // middle column layer to show when the valve disk is orthogonal to the screen.
    addCylinder() {
      let height = this.o.centerRad*2 - this.o.centerStrokeWidth + 0.5;
      let transform = `translate(-${this.o.centerRad/10/2}px, -${height/2}px)`;
      let opacity = this.getCylinderOpacity();

      this.cylinder = this.g.append("rect")
        .datum({opacity: opacity})
        .attr("width", this.o.centerRad/10)
        .attr("height", height)
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("fill", this.o.bodyColor)
        .attr("fill-opacity", function(d) { return d.opacity; })
        .style("transform", transform);
    }

    addLabel() {
      this.labelGroup = this.g.append('g');
      let text = this.open === true ? this.o.openLabel : this.o.closedLabel;

      this.label = this.labelGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("font-family", "Helvetica")
        .attr("font-size", this.o.labelFontSize)
        .attr("fill", this.o.labelFontColor)
        .attr("font-weight", this.o.labelFontWeight)
        .text(text);
    }

    calculateLabelDim() {
      this.labelWidth = this.label.node().getBBox().width;
      this.labelHeight = this.label.node().getBBox().height;
      this.labelBgWidth = this.labelWidth + this.o.labelPadding*2;
      this.labelBgHeight = this.labelHeight + this.o.labelPadding*2;
      this.labelTransform = `translate(0, ${this.labelBgHeight/4}px)`;
      this.bgTransform = `translate(-${this.labelBgWidth/2}px, -${this.labelBgHeight/2}px)`;
    }
    //-${this.labelBgHeight/2}

    addLabelBg() {
      this.labelBg = this.labelGroup.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", this.o.labelBgColor)
        .attr("rx", this.o.labelBgCornerRadius)
        .attr("ry", this.o.labelBgCornerRadius);

      let label = this.label.remove();
      this.labelGroup.append(function() {
        return label.node();
      });
    }

    positionLabelBg() {
      this.calculateLabelDim();

      this.label.style("transform", this.labelTransform);
      this.labelBg
        .attr("width", this.labelBgWidth)
        .attr("height", this.labelBgHeight)
        .style("transform", this.bgTransform);

      this.labelGroup.attr('transform', `translate(0, ${this.o.height/4 - this.labelBgHeight/2})`)
    }

    openValve() {
      if(!this.open) {
        this.open = true;

        this.transitionValveDisk();
        this.fillWaterAndStartWave();
        this.updateLabel();
      }
    }

    closeValve() {
      if(this.open) {
        this.open = false;

        this.transitionValveDisk();
        this.hideWaveAndRetreatWater();
        this.updateLabel();
      }
    }

    toggleValve() {
      if(this.open) {
        this.closeValve();      
      } else {
        this.openValve();
      }
    }

    transitionValveDisk() {
      let endDef = this.open ? "rotate3d(0,1,0,0deg)" : "rotate3d(0,1,0,90deg)";

      this.valveDisk
        .transition()
        .duration(this.o.duration)
        .ease(d3.easePolyOut.exponent(4))
        .styleTween("transform", function(d) {
        let interpolator = d3.interpolateString(d.transform, endDef);

        return function(t) {
          d.transform = interpolator(t);
          return d.transform;
        };
      });
    }

    fillWaterAndStartWave() {
      let endGradFill = "#FFF"
      let endOffset = "100%";
      let that = this;

      this.waterGradEnd
        .transition()
        .duration(this.o.duration*2)
        .ease(d3.easeLinear)
        .delay(this.o.duration/2)
        .attrTween("offset", function(d) {
        let interpolator = d3.interpolateString(d.offset, endOffset)

        return function(t) {
          d.offset = interpolator(t);
          return d.offset;
        }
      })
        .attrTween("stop-color", function(d) {
        let interpolator = d3.interpolateRgb(d.fill, endGradFill)

        return function(t) {
          d.fill = interpolator(t);
          return d.fill;
        }
      }).on("end", function() {
        if (that.currentEnabled === true) {
          that.animateCurrent();
        }

        if (that.waveEnabled === true) {
          that.waves.forEach(function(el) {
            el.transition()
              .duration(that.o.duration*2)
              .ease(d3.easeLinear)
              .attrTween("fill-opacity", function(d) {
              let interpolator = d3.interpolateNumber(d.opacity, 1);

              return function(t) {
                d.opacity = interpolator(t);
                return d.opacity;
              };
            });
          });
        }
      });
    }

    hideWaveAndRetreatWater () {
      let endGradFill = "#000"
      let endOffset = "50%";
      let that = this;

      this.waterGradEnd
        .transition()
        .duration(this.o.duration/4)
        .ease(d3.easeLinear)
        .attrTween("offset", function(d) {
        let interpolator = d3.interpolateString(d.offset, endOffset)

        return function(t) {
          d.offset = interpolator(t);
          return d.offset;
        }
      })
        .attrTween("stop-color", function(d) {
        let interpolator = d3.interpolateRgb(d.fill, endGradFill)

        return function(t) {
          d.fill = interpolator(t);
          return d.fill;
        }
      });

      if (this.waveEnabled === true) {
        this.waves.forEach(function(el) {
          el.transition()
            .duration(that.o.duration/5)
            .ease(d3.easeLinear)
            .attrTween("fill-opacity", function(d) {
            let interpolator = d3.interpolateNumber(d.opacity, 0);

            return function(t) {
              d.opacity = interpolator(t);
              return d.opacity;
            };
          });
        });
      }
    }


    createWave(height, waveWidth, amplitude, waveDuration, waveColor) {
      let that = this;
      this.waveEnabled = true;
      let uniqId = this.uniqId();

      let clipPath = this.getUniqUrl(uniqId);
      let waveVertical = this.g.append("g")
      .attr("clip-path", clipPath);

      let waveFill = waveVertical
      .append("circle")
      .datum({ opacity: 1 })
      .attr("r", this.o.centerRad - this.o.centerStrokeWidth/2 + 0.3)
      .attr("fill", waveColor)
      .attr("fill-opacity", function(d) { return d.opacity; });

      let waveClip = this.g.append("clipPath")
      .attr("id", uniqId);
      let waveHorizontal = waveClip.append("path");

      let clipDef = `M0 0 Q${waveWidth / 2} ${amplitude}, ${waveWidth} 0 T${waveWidth * 2} 0`;
      let minRequiredClipWidth = this.o.centerRad * 2 + waveWidth * 2 + this.o.centerStrokeWidth / 2;
      let clipWidth = waveWidth * 2;

      while ( clipWidth < minRequiredClipWidth ) {
        clipWidth += waveWidth;
        clipDef += ` T${clipWidth} 0`;
        clipWidth += waveWidth;
        clipDef += ` T${clipWidth} 0`;
      }

      let clipDefArray = [clipDef, `L${clipWidth}`, `${this.o.centerRad*2}`, "L0", `${this.o.centerRad*2}`, "Z"];
      clipDef = clipDefArray.join(" ");

      let waveStartDef = `translate(-${this.o.centerRad + waveWidth*2}px, ${height}px)`;
      let waveEndDef = `translate(-${this.o.centerRad}px, ${height}px)`;

      waveHorizontal
        .datum({ transform: waveStartDef})
        .attr("d", clipDef)
        .attr("fill-opacity", 1)
        .attr("fill", "#fff")
        .attr("stroke-width", 0)
        .style("transform", function(d) {return d.transform});

      animate();

      function animate() {
        waveHorizontal
          .transition()
          .duration(waveDuration)
          .ease(d3.easeLinear)
          .styleTween("transform", function(d) {
          let interpolator = d3.interpolateString(d.transform, waveEndDef);

          return function(t) {
            d.transform = interpolator(t);
            return d.transform;
          }
        }).on("end", function (d) {
          d.transform = waveStartDef;
          animate();
        });
      }

      this.waves.push(waveFill);
    }

    // interaction functions.
    click (callback) {
      if ( typeof callback !== "function" ) {
        throw new Error("argument must be a function");
      }
      this.svgContainer.on("click", callback.bind(this));
    }

    updateLabel() {
      let text = this.open === true ? this.o.openLabel : this.o.closedLabel;

      this.label.text(text);
      this.positionLabelBg();
    }

    destroy() {
      this.svgContainer.remove();
    }

    redraw() {
      this.destroy();
      this.init();
    }
  } //end of class

}(jQuery));