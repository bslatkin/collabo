/** @jsx React.DOM */

var PaintMode = {
    FILLED: 'filled',
    EMPTY: 'empty',
    NONE: 'none',
};


function PaintState() {
    this.mode = PaintMode.NONE;
}

PaintState.prototype.startMousePainting = function(mode) {
    console.log('Starting mouse painting, mode=' + mode);
    this.mode = mode;
};

PaintState.prototype.endMousePainting = function() {
    console.log('Ended mouse painting');
    this.mode = PaintMode.NONE;
}


var Pixel = React.createClass({
    getInitialState: function() {
        return {paint: PaintMode.EMPTY};
    },
    handleMouseDown: function(event) {
        var nextState = PaintMode.FILLED;
        if (this.state.paint == PaintMode.FILLED) {
            nextState = PaintMode.EMPTY;
        }
        this.props.paintState.startMousePainting(nextState);
        this.setState({paint: nextState});
        this.props.triggerSiblings(
            this, this.props.x, this.props.y, nextState);
    },
    handleMouseUp: function(event) {
        this.props.paintState.endMousePainting();
    },
    handleMouseEnter: function(event) {
        var nextState = this.props.paintState.mode;
        if (nextState == PaintMode.NONE) {
            return;
        }
        this.setState({paint: nextState});
        this.props.triggerSiblings(
            this, this.props.x, this.props.y, nextState);
    },
    render: function() {
        return (
            <div className={
                    'pixel ' +
                    this.state.paint.toLowerCase() +
                    (this.props.startOfRow ? ' start-of-row' : '')}
                 onMouseDown={this.handleMouseDown}
                 onMouseLeave={this.handleMouseLeave}
                 onMouseEnter={this.handleMouseEnter} />
        )
    }
});


var Grid = React.createClass({
    handleMouseDown: function() {
        this.props.paintState.startMousePainting(PaintMode.FILLED);
    },
    handleMouseLeave: function() {
        this.props.paintState.endMousePainting();
    },
    handleMouseUp: function() {
        this.props.paintState.endMousePainting();
    },
    triggerSiblings: function(sender, x, y, mode) {
        var penWidthSquared = Math.pow(this.props.penWidth, 2);
        React.Children.forEach(this.props.children, function(child) {
            if (sender === child) {
                return;
            }
            var distanceX = Math.pow(child.props.x - x, 2);
            var distanceY = Math.pow(child.props.y - y, 2);
            var distanceSquared = distanceX + distanceY;
            if (distanceSquared <= penWidthSquared) {
                child.setState({paint: mode});
            }
        });
    },
    render: function() {
        return (
            <div className="grid"
                 onMouseLeave={this.handleMouseLeave}
                 onMouseUp={this.handleMouseUp}>
                {this.props.children}
            </div>
        )
    }
});


var Controller = React.createClass({
    paintState: new PaintState(),
    triggerSiblings: function(sender, x, y, nextState) {
        this.refs.grid.triggerSiblings(sender, x, y, nextState);
    },
    render: function() {
        var children = [];
        for (var i = 0; i < this.props.height; i++) {
            for (var j = 0; j < this.props.width; j++) {
                children.push(
                    <Pixel x={i}
                           y={j}
                           triggerSiblings={this.triggerSiblings}
                           startOfRow={j == 0}
                           paintState={this.paintState} />
                );
            }
        }
        return (
            <Grid ref="grid"
                  paintState={this.paintState}
                  penWidth={this.props.penWidth}>
                {children}
            </Grid>
        )
    }
});


React.renderComponent(
    <Controller width={100}
                height={100}
                penWidth={3.25} />,
    document.getElementById('content'));
