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
        return {filled: false};
    },
    handleMouseDown: function(event) {
        var nextState = !this.state.filled;
        this.props.paintState.startMousePainting(
            nextState ? PaintMode.FILLED : PaintMode.EMPTY);
        this.setState({filled: nextState});
    },
    handleMouseUp: function(event) {
        this.props.paintState.endMousePainting();
    },
    handleMouseEnter: function(event) {
        var mode = this.props.paintState.mode;
        if (mode == PaintMode.FILLED) {
            this.setState({filled: true});
        } else if (mode == PaintMode.EMPTY) {
            this.setState({filled: false});
        }
    },
    render: function() {
        var filledClass = this.state.filled ? 'filled' : 'empty';
        return (
            <div className={'pixel ' + filledClass}
                 onMouseDown={this.handleMouseDown}
                 onMouseLeave={this.handleMouseLeave}
                 onMouseEnter={this.handleMouseEnter}>
            </div>
        )
    }
});


var Grid = React.createClass({
    handleMouseLeave: function() {
        this.props.paintState.endMousePainting();
    },
    handleMouseUp: function() {
        this.props.paintState.endMousePainting();
    },
    render: function() {
        var pixels = [];
        for (var i = 0; i < this.props.height; i++) {
            for (var j = 0; j < this.props.width; j++) {
                pixels.push(
                    <Pixel x={i}
                           y={j}
                           endOfRow={j == (this.props.width - 1)}
                           paintState={this.props.paintState} />
                );
            }
            pixels.push(
                <br/>
            );
        }
        return (
            <div className="grid"
                 onMouseDown={this.handleMouseDown}
                 onMouseLeave={this.handleMouseLeave}
                 onMouseUp={this.handleMouseUp}>
                {pixels}
            </div>
        )
    }
});


var paintState = new PaintState();

React.renderComponent(
    <Grid width="100" height="100" paintState={paintState} />,
    document.getElementById('content'));
