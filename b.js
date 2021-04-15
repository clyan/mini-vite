function Person(name, age){
    this.name = name;
    this.age = age;
}
Person.prototype.setName = function(name){
    this.name = name;
    return this;
}

Person.prototype.setAge = function(age){
    this.age = age;
    return this;
}

// const a = new Person().setAge(24).setName("ywy");


Function.prototype.bind = function(obj, ...args) {
    const fn = this;
    return function(...arg){
        return fn.apply(obj, [...args,...arg])
    }
}
const obj = {
    setName: function(name){
        this.name = name;
        return this;
    },
    setAge: function(age){
        this.age = age;
        return this;
    }
};
const bindFn = Person.bind(obj, "1");
bindFn("2")
console.log(obj)