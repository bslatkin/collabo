/** @jsx React.DOM */

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
        this.props.markPixel(this.props.x, this.props.y);
    },
    handleMouseUp: function(event) {
        this.props.endMousePainting();
    },
    handleMouseEnter: function(event) {
        this.props.markPixel(this.props.x, this.props.y);
    },
    render: function() {
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
    markPaintBrush: function(x, y) {
        var penWidthSquared = Math.pow(this.props.penWidth, 2);
        var minX = Math.ceil(Math.max(x - this.props.penWidth, 0));
        var minY = Math.ceil(Math.max(y - this.props.penWidth, 0));
        var maxX = Math.ceil(
            Math.min(x + this.props.penWidth, this.props.width - 1));
        var maxY = Math.ceil(
            Math.min(y + this.props.penWidth, this.props.height - 1));

        for (var i = minX; i < maxX; i++) {
            for (var j = minY; j < maxY; j++) {
                var distanceX = Math.pow(i - x, 2);
                var distanceY = Math.pow(j - y, 2);
                var distanceSquared = distanceX + distanceY;
                if (distanceSquared <= penWidthSquared) {
                    var pixel = this.refs['pixel-' + i + '-' + j];
                    pixel.paint(this.mode);
                }
            }
        }
    },
    markPixel: function(x, y) {
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

        var z = 0;

        while (((endX - i) != 0 || (endY - j) != 0) && z < 100) {
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
            z++;
        }

        this.markPaintBrush(i, j);
        this.lastMark = thisMark;
    },
    render: function() {
        var children = [];
        for (var j = 0; j < this.props.height; j++) {
            for (var i = 0; i < this.props.width; i++) {
                children.push(
                    <Pixel x={i}
                           y={j}
                           ref={'pixel-' + i + '-' + j}
                           startMousePainting={this.startMousePainting}
                           endMousePainting={this.endMousePainting}
                           markPixel={this.markPixel}
                           startOfRow={i == 0} />
                );
            }
        }
        return (
            <div className="grid"
                 onMouseLeave={this.handleMouseLeave}
                 onMouseUp={this.handleMouseUp}
                 paintState={this.paintState}
                 penWidth={this.props.penWidth}>
                {children}
            </div>
        )
    }
});


React.renderComponent(
    <Grid width={200}
          height={200}
          penWidth={2.25} />,
    document.getElementById('content'));
