/** @jsx React.DOM */
// Copyright 2014 Brett Slatkin

var PaintMode = {
    FILLED: 'filled',
    EMPTY: 'empty',
    NONE: 'none',
};


var Pixel = React.createClass({
    getInitialState: function() {
        return {paint: PaintMode.EMPTY};
    },
    paint: function(mode) {
        this.setState({paint: mode});
    },
    handleMouseDown: function(event) {
        var nextState = PaintMode.FILLED;
        if (this.state.paint == PaintMode.FILLED) {
            nextState = PaintMode.EMPTY;
        }
        this.props.startMousePainting(nextState);
        this.props.strokePixel(this.props.x, this.props.y);
    },
    handleMouseUp: function(event) {
        this.props.endMousePainting();
    },
    handleMouseEnter: function(event) {
        this.props.strokePixel(this.props.x, this.props.y);
    },
    render: function() {
        this.props.incrementRenderCount();
        return (
            <div className={
                    'pixel ' +
                    this.state.paint.toLowerCase() +
                    (this.props.startOfRow ? ' start-of-row' : '')}
                 data-x={this.props.x}
                 data-y={this.props.y}
                 onMouseDown={this.handleMouseDown}
                 onMouseLeave={this.handleMouseLeave}
                 onMouseEnter={this.handleMouseEnter} />
        )
    }
});


var RenderStats = React.createClass({
    renders: 0,
    when: 0,
    getInitialState: function() {
        return {rate: 0}
    },
    increment: function() {
        this.renders++;
    },
    clear: function() {
        this.renders = 0;
        this.when = (new Date()).getTime();
    },
    componentWillMount: function() {
        this.clear();
        setInterval(this.sampleRenders, 500);
    },
    sampleRenders: function() {
        var oldCount = this.renders;
        var timeDiff = (new Date()).getTime() - this.when;
        this.clear();
        this.setState({rate: oldCount / timeDiff * 1000.0});
    },
    render: function() {
        this.increment();
        return (
            <div>
                Renders per second: {this.state.rate}
            </div>
        )
    }
});


var Grid = React.createClass({
    mode: PaintMode.NONE,
    lastMark: null,
    startMousePainting: function(mode) {
        this.mode = mode;
    },
    endMousePainting: function() {
        this.mode = PaintMode.NONE;
        this.lastMark = null;
    },
    handleMouseLeave: function() {
        this.endMousePainting();
    },
    handleMouseUp: function() {
        this.endMousePainting();
    },
    handleResetButton: function(event) {
        event.preventDefault();
        this.mode = PaintMode.EMPTY;
        for (var i = 0; i < this.props.width; i++) {
            for (var j = 0; j < this.props.height; j++) {
                this.fillPixel(i, j);
            }
        }
        this.mode = PaintMode.NONE;
    },
    fillPixel: function(x, y) {
        var pixel = this.refs['pixel-' + x + '-' + y];
        if (pixel.state.paint != this.mode) {
            pixel.paint(this.mode);
        }
    },
    markPaintBrush: function(x, y) {
        var penWidthSquared = Math.pow(this.props.penWidth, 2);
        var minX = Math.max(
            0, Math.floor(x - this.props.penWidth));
        var maxX = Math.min(
            this.props.width, Math.ceil(x + this.props.penWidth));
        var minY = Math.max(
            0, Math.floor(y - this.props.penWidth));
        var maxY = Math.min(
            this.props.height, Math.ceil(y + this.props.penWidth));

        for (var i = minX; i < maxX; i++) {
            for (var j = minY; j < maxY; j++) {
                var distanceX = Math.pow(i - x, 2);
                var distanceY = Math.pow(j - y, 2);
                var distanceSquared = distanceX + distanceY;
                if (distanceSquared <= penWidthSquared) {
                    this.fillPixel(i, j);
                }
            }
        }
    },
    strokePixel: function(x, y) {
        if (this.mode == PaintMode.NONE) {
            return;
        }

        var thisMark = {x: x, y: y};

        if (!this.lastMark) {
            this.markPaintBrush(x, y);
            this.lastMark = thisMark;
            return;
        }

        // Interpolate the line from the last known painting point to the
        // current one. We do this because mouse move events come from the
        // browser very infrequently when the mouse is moving fast.
        var startX = this.lastMark.x;
        var endX = x;
        var startY = this.lastMark.y;
        var endY = y;
        var stepX = endX > startX ? 1 : -1;
        var stepY = endY > startY ? 1 : -1;
        var slope = (endY - startY) / (endX - startX);
        var i = startX;
        var j = startY;

        while ((endX - i) != 0 || (endY - j) != 0) {
            this.markPaintBrush(i, j);

            var nextX = i + stepX;
            var nextY = j;
            if (slope !== Infinity || slope !== -Infinity) {
                nextY = startY + (nextX - startX) * slope;
            }

            var diff = nextY - j;
            if (diff < -1 || diff > 1) {
                j += stepY;
            } else {
                i += stepX;
            }
        }

        this.lastMark = thisMark;
    },
    incrementRenderCount: function() {
        if (this.refs.stats) {
            this.refs.stats.increment();
        }
    },
    render: function() {
        this.incrementRenderCount();
        var children = [];
        for (var j = 0; j < this.props.height; j++) {
            for (var i = 0; i < this.props.width; i++) {
                var key = 'pixel-' + i + '-' + j;
                children.push(
                    <Pixel x={i}
                           y={j}
                           key={key}
                           ref={key}
                           incrementRenderCount={this.incrementRenderCount}
                           startMousePainting={this.startMousePainting}
                           endMousePainting={this.endMousePainting}
                           strokePixel={this.strokePixel}
                           startOfRow={i == 0} />
                );
            }
        }
        return (
            <div>
                <RenderStats ref="stats" />
                <div>
                    <button onClick={this.handleResetButton}>Clear</button>
                </div>
                <div className="grid"
                     onMouseLeave={this.handleMouseLeave}
                     onMouseUp={this.handleMouseUp}
                     paintState={this.paintState}
                     penWidth={this.props.penWidth}>
                    {children}
                </div>
            </div>
        )
    }
});


React.initializeTouchEvents(true);


React.renderComponent(
    <Grid width={200}
          height={200}
          penWidth={2.25} />,
    document.getElementById('content'));
