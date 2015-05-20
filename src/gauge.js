(function() {
    function Gauge(canvas, opts) {
        this.canvas = canvas;

        if (typeof this.canvas === "undefined" || canvas == null) {
            this.error = "Canvas is undefined";
        } else if (!this.canvas.getContext) {
            this.error = "Canvas is unsupported";
        }
        if (this.error != null) {
            console.log(this.error);
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        this.radius = this.canvas.width <= this.canvas.height ? this.canvas.width / 2 : this.canvas.height / 2;

        this.ctx.translate(this.radius, this.canvas.height / 2);

        //todo opts validation
        this.angleDelta = toRadians(getCheckedValue(opts.angleDelta, 10));
        this.lineWidth = getCheckedValue(opts.lineWidth, 5);
        this.fontSize = getCheckedValue(opts.fontSize, 8);
        this.currentValue = getCheckedValue(opts.defaultValue, 0);

        this.mainRadius = this.radius - this.fontSize;
        this.marksRadiusEnd = this.mainRadius - 5;
        this.marksRadiusStart = this.marksRadiusEnd - 5;
        this.arcRadius = this.marksRadiusStart - this.lineWidth * 2;
        this.pointerRadius = this.arcRadius - this.lineWidth;

        this.startAngle = (1 - this.angleDelta) * Math.PI;
        this.endAngle = (2 + this.angleDelta) * Math.PI;
        this.totalAngle = this.endAngle - this.startAngle;

        function getCheckedValue(value, defaultValue) {
            return value === undefined || value == null ? defaultValue : value;
        }
    }

    Gauge.prototype.getPointAngle = function(value, maxValue) {
        return  value === undefined || value == null || maxValue == null ?
            this.startAngle : this.startAngle + this.totalAngle * (value / maxValue);
    };

    Gauge.prototype.render = function(values) {
        if (this.error != null) {
            return;
        }

        var maxValue, valuesCount, markAngle, markStartX, markStartY, markEndX, markEndY;
        //rendering arc
        this.ctx.beginPath();

        this.ctx.arc(0, 0, this.arcRadius, this.startAngle, this.endAngle, false);
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = '#003300';
        this.ctx.stroke();

        //rendering scale marks
        //todo values validation
        valuesCount = values.length;
        if (valuesCount > 1) {
            this.maxValue = values[valuesCount - 1];

            if (values[0] !== 0) {
                values.unshift(0);
                valuesCount++;
            }

            for (var i = 0; i < valuesCount; i++) {
                markAngle = this.getPointAngle(values[i], this.maxValue);

                markStartX = getCirclePointX(this.marksRadiusStart, markAngle);
                markStartY = getCirclePointY(this.marksRadiusStart, markAngle);

                markEndX = getCirclePointX(this.marksRadiusEnd, markAngle);
                markEndY = getCirclePointY(this.marksRadiusEnd, markAngle);

                this.ctx.beginPath();
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = 'green';
                this.ctx.moveTo(markStartX, markStartY);
                this.ctx.lineTo(markEndX, markEndY);
                this.ctx.stroke();

                //rendering scale values
                var valueX = getCirclePointX(this.mainRadius, markAngle);
                var valueY = getCirclePointY(this.mainRadius, markAngle);

                this.ctx.font = this.fontSize + "pt Arial";
                this.ctx.fillStyle = "#000000";
                this.ctx.fillText(values[i].toString(), valueX - 3, valueY);
            }
        }
        
        this.renderValue(this.currentValue);
    };

    Gauge.prototype.renderValue = function(value) {
        var pointerAngle, pointerX, pointerY;

        if (this.currentValue != null) {
            this.removePointer();
        }

        this.currentValue = value;

        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = 'gray';
        this.ctx.fill();

        pointerAngle = this.getPointAngle(this.currentValue, this.maxValue);

        pointerX = getCirclePointX(this.pointerRadius, pointerAngle);
        pointerY = getCirclePointY(this.pointerRadius, pointerAngle);

        this.ctx.beginPath();
        this.ctx.fillStyle = 'gray';
        this.ctx.moveTo(-3, 0);
        this.ctx.lineTo(pointerX, pointerY);
        this.ctx.lineTo(3, 0);
        this.ctx.closePath();
        this.ctx.fill();
    };

    Gauge.prototype.removePointer = function() {
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

    window.Gauge = Gauge;
})();