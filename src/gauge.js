/*
 * gauge
 *
 * gauge widget
 *
 * (c) 2015 Alexandra Shatalina
 * License: MIT
 */
(function() {
    function Gauge(canvas, opts) {
        var angleDegrees, angleDelta;
        this.canvas = canvas;

        if (this.canvas === undefined || canvas == null) {
            this.error = "Canvas is undefined";
        } else if (!this.canvas.getContext) {
            this.error = "Canvas is unsupported";
        }
        if (this.error != null) {
            console.error(this.error);
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        this.radius = this.canvas.width <= this.canvas.height ? this.canvas.width / 2 : this.canvas.height / 2;

        this.ctx.translate(this.radius, this.canvas.height / 2);

        this.arcColor = getCheckedValue(opts.arcColor, "gray");
        this.pointerColor = getCheckedValue(opts.pointerColor, "#07c");
        this.cautionColor = getCheckedValue(opts.cautionColor, "#ffcc00");
        this.dangerColor = getCheckedValue(opts.dangerColor, "red");

        this.lineWidth = getCheckedValue(opts.lineWidth, 4);
        this.fontSize = getCheckedValue(opts.fontSize, 10);
        this.contextAngle = null;

        this.mainRadius = this.radius - this.fontSize;
        this.marksRadiusEnd = this.mainRadius - 10;
        this.marksRadiusStart = this.marksRadiusEnd - 5;
        this.arcRadius = this.marksRadiusStart - this.lineWidth * 2;
        this.pointerRadius = this.arcRadius - this.lineWidth;

        angleDegrees = getCheckedValue(opts.arcAngle, 200) - 180;
        angleDelta = toRadians(angleDegrees / 2);
        this.startAngle = Math.PI - angleDelta;
        this.endAngle = angleDelta;
        this.totalAngle = Math.PI * 2 - this.startAngle + this.endAngle;

        function getCheckedValue(value, defaultValue) {
            return value === undefined || value == null ? defaultValue : value;
        }
    }

    Gauge.prototype.getPointAngle = function(value) {
        return value === undefined || value == null || this.maxValue == null ?
            this.startAngle : this.startAngle + this.totalAngle * (value / this.maxValue);
    };

    Gauge.prototype.setContextAngle = function(angle) {
        if (this.error != null) {
            return;
        }

        if (this.contextAngle != null) {
            this.ctx.rotate(-this.contextAngle);
        }

        if (angle != null) {
            this.contextAngle = angle;
            this.ctx.rotate(this.contextAngle);
        }
    };

    Gauge.prototype.renderArc = function(startAngle, endAngle, color) {
        if (this.error != null) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.arcRadius, startAngle, endAngle, false);
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = color;
        this.ctx.stroke();
    };

    Gauge.prototype.render = function(values, cautionValue, dangerValue, defaultValue) {
        if (this.error != null) {
            return;
        }
        this.setContextAngle(0);
        this.ctx.clearRect(-this.radius, -this.canvas.height / 2 , this.canvas.width, this.canvas.height );

        var cautionAngle, dangerAngle, valuesCount, markAngle, markStartX, markStartY, markEndX, markEndY;

        //rendering scale marks
        valuesCount = values.length;
        if (valuesCount > 1) {
            if (values[0] !== 0) {
                values.unshift(0);
                valuesCount++;
            }

            if (valuesCount > 2) {
                this.maxValue = getMax(values);

                if (dangerValue !== undefined && dangerValue != null) {
                    dangerAngle = this.getPointAngle(dangerValue);
                    this.renderArc(dangerAngle, this.endAngle, this.dangerColor);
                }

                if (cautionValue !== undefined && cautionValue != null &&
                    (dangerValue === undefined || cautionValue < dangerValue)) {
                    cautionAngle = this.getPointAngle(cautionValue);
                    this.renderArc(cautionAngle, dangerAngle === undefined ? this.endAngle : dangerAngle, this.cautionColor);
                }
            }
        }

        //rendering arc
        this.renderArc(this.startAngle, cautionAngle !== undefined ? cautionAngle :
            (dangerAngle != undefined ? dangerAngle : this.endAngle), this.arcColor);

        //rendering scale marks
        if (valuesCount > 1) {
            for (var i = 0; i < valuesCount; i++) {
                markAngle = this.getPointAngle(values[i]);

                markStartX = getCirclePointX(this.marksRadiusStart, markAngle);
                markStartY = getCirclePointY(this.marksRadiusStart, markAngle);

                markEndX = getCirclePointX(this.marksRadiusEnd, markAngle);
                markEndY = getCirclePointY(this.marksRadiusEnd, markAngle);

                this.ctx.beginPath();
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = this.arcColor;
                this.ctx.moveTo(markStartX, markStartY);
                this.ctx.lineTo(markEndX, markEndY);
                this.ctx.stroke();

                //rendering scale values
                var valueX = getCirclePointX(this.mainRadius, markAngle);
                var valueY = getCirclePointY(this.mainRadius, markAngle);

                this.ctx.font = this.fontSize + "pt Arial";
                this.ctx.fillStyle = this.arcColor;
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillText(values[i].toString(), valueX, valueY);
            }
        }

        if (defaultValue !== undefined && defaultValue != null) {
            this.renderValue(defaultValue);
        }

    };

    Gauge.prototype.renderValue = function(value) {
        if (this.error != null) {
            return;
        }

        if (this.currentValue != null) {
            this.removePointer();
        }

        this.currentValue = value;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = this.pointerColor;
        this.ctx.fill();

        this.setContextAngle(this.getPointAngle(this.currentValue));

        this.ctx.beginPath();
        this.ctx.fillStyle = this.pointerColor;
        this.ctx.moveTo(0, 3);
        this.ctx.lineTo(this.pointerRadius, 0);
        this.ctx.lineTo(0, -3);
        this.ctx.closePath();
        this.ctx.fill();
    };

    Gauge.prototype.removePointer = function() {
        if (this.error != null) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.pointerRadius, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
    };

    function getCirclePointX(radius, angle) {
       return radius * Math.cos(angle);
    }

    function getCirclePointY(radius, angle) {
        return radius * Math.sin(angle);
    }

    function toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    function getMax(array) {
        return Math.max.apply(null, array);
    }

    window.Gauge = Gauge;
})();
